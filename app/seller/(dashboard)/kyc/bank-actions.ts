'use server';

import { revalidatePath } from 'next/cache';
import { BankChangeStatus, KycStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSellerOwner } from '@/lib/seller/session';
import { recordAudit } from '@/lib/audit';
import { compareBusinessNames } from '@/lib/kyc/nameMatch';
import { sendBankChangeOtpEmail } from '@/lib/email/send';
import { generateOtp, hashOtp, otpMatches, OTP_MAX_ATTEMPTS, OTP_MAX_SENDS, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from '@/lib/bank/otp';

type Result = { error: string } | { ok: true; message?: string };

const OPEN = [BankChangeStatus.OTP_PENDING, BankChangeStatus.PENDING_REVIEW];

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
}

function refresh() {
  revalidatePath('/seller/kyc');
  revalidatePath('/admin/verification');
}

// The owner asks to change where payouts go. Nothing changes yet: a code goes to the owner's email,
// then ops review the request. The new details only replace the old ones when ops approve.
export async function requestBankChangeAction(formData: FormData): Promise<Result> {
  const owner = await requireSellerOwner();
  try {
    const bankName = text(formData, 'bankName');
    const accountNumber = text(formData, 'bankAccountNumber').replace(/\s/g, '');
    const accountName = text(formData, 'bankAccountName');
    if (bankName.length < 2) throw new Error('Enter the bank name.');
    if (!/^\d{10}$/.test(accountNumber)) throw new Error('A Nigerian bank account number has 10 digits.');
    if (accountName.length < 3) throw new Error('Enter the account name.');

    const [profile, user] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { userId: owner.sellerId } }),
      prisma.user.findUniqueOrThrow({ where: { id: owner.userId }, select: { email: true, name: true, businessName: true } }),
    ]);
    if (!profile || profile.kycStatus !== KycStatus.APPROVED) throw new Error('Only a verified seller can change bank details here. Use the form above if you are still being verified.');
    if (profile.bankName === bankName && profile.bankAccountNumber === accountNumber && profile.bankAccountName === accountName) {
      throw new Error('Those are the details already on file.');
    }
    if (await prisma.bankChangeRequest.count({ where: { sellerId: owner.sellerId, status: { in: OPEN } } })) {
      throw new Error('You already have a bank-detail change in progress. Finish or cancel it first.');
    }

    const registryName = profile.cacVerifiedAt ? profile.cacVerifiedCompanyName : null;
    const nameMatch = compareBusinessNames(accountName, registryName ?? user.businessName ?? user.name);

    const code = generateOtp();
    const request = await prisma.bankChangeRequest.create({
      data: {
        sellerId: owner.sellerId,
        requestedById: owner.userId,
        newBankName: bankName,
        newAccountNumber: accountNumber,
        newAccountName: accountName,
        oldBankName: profile.bankName,
        oldAccountNumber: profile.bankAccountNumber,
        oldAccountName: profile.bankAccountName,
        nameMatch,
        otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        otpLastSentAt: new Date(),
      },
    });
    await prisma.bankChangeRequest.update({ where: { id: request.id }, data: { otpHash: hashOtp(request.id, code) } });

    try {
      await sendBankChangeOtpEmail(user.email, code);
    } catch (err) {
      // No code was delivered, so there is nothing for the owner to enter. Remove the request.
      await prisma.bankChangeRequest.update({ where: { id: request.id }, data: { status: BankChangeStatus.CANCELLED } });
      console.error('bank change OTP email failed:', err);
      throw new Error('We could not send the code to your email. Try again in a few minutes, or contact BuildersPool.');
    }

    await recordAudit({
      actor: { id: owner.userId, role: 'SELLER' },
      action: 'bank_change.requested',
      entityType: 'BankChangeRequest',
      entityId: request.id,
      summary: 'Asked to change bank details (code emailed to the owner)',
    });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not start the change.' };
  }
}

async function ownRequest(sellerId: string, id: string) {
  return prisma.bankChangeRequest.findFirst({ where: { id, sellerId } });
}

export async function verifyBankChangeCodeAction(formData: FormData): Promise<Result> {
  const owner = await requireSellerOwner();
  try {
    const request = await ownRequest(owner.sellerId, text(formData, 'requestId'));
    if (!request || request.status !== BankChangeStatus.OTP_PENDING) throw new Error('This request is no longer waiting for a code. Refresh the page.');
    if (!request.otpExpiresAt || request.otpExpiresAt < new Date()) throw new Error('That code has expired. Send a new code.');
    if (request.otpAttempts >= OTP_MAX_ATTEMPTS) throw new Error('Too many wrong codes. Cancel this request and start again.');

    const code = text(formData, 'code').replace(/\s/g, '');
    if (!otpMatches(request.id, code, request.otpHash)) {
      const attempts = request.otpAttempts + 1;
      await prisma.bankChangeRequest.update({
        where: { id: request.id },
        data: { otpAttempts: attempts, ...(attempts >= OTP_MAX_ATTEMPTS ? { status: BankChangeStatus.CANCELLED, otpHash: null } : {}) },
      });
      refresh();
      throw new Error(attempts >= OTP_MAX_ATTEMPTS ? 'Too many wrong codes, so this request was cancelled. Start again.' : `That code is not right. ${OTP_MAX_ATTEMPTS - attempts} ${OTP_MAX_ATTEMPTS - attempts === 1 ? 'try' : 'tries'} left.`);
    }

    // A guarded update, so a double submit confirms once.
    const { count } = await prisma.bankChangeRequest.updateMany({
      where: { id: request.id, status: BankChangeStatus.OTP_PENDING },
      data: { status: BankChangeStatus.PENDING_REVIEW, otpVerifiedAt: new Date(), otpHash: null },
    });
    if (count > 0) {
      await recordAudit({
        actor: { id: owner.userId, role: 'SELLER' },
        action: 'bank_change.code_confirmed',
        entityType: 'BankChangeRequest',
        entityId: request.id,
        summary: 'Confirmed the emailed code. Waiting for ops review. Payouts are held.',
      });
    }
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not check that code.' };
  }
}

export async function resendBankChangeCodeAction(formData: FormData): Promise<Result> {
  const owner = await requireSellerOwner();
  try {
    const request = await ownRequest(owner.sellerId, text(formData, 'requestId'));
    if (!request || request.status !== BankChangeStatus.OTP_PENDING) throw new Error('This request is no longer waiting for a code. Refresh the page.');
    if (request.otpSentCount >= OTP_MAX_SENDS) throw new Error('You have used all the codes for this request. Cancel it and start again.');
    if (request.otpLastSentAt && Date.now() - request.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) throw new Error('Wait a minute before asking for another code.');

    const user = await prisma.user.findUniqueOrThrow({ where: { id: owner.userId }, select: { email: true } });
    const code = generateOtp();
    await prisma.bankChangeRequest.update({
      where: { id: request.id },
      data: { otpHash: hashOtp(request.id, code), otpExpiresAt: new Date(Date.now() + OTP_TTL_MS), otpAttempts: 0, otpSentCount: request.otpSentCount + 1, otpLastSentAt: new Date() },
    });
    try {
      await sendBankChangeOtpEmail(user.email, code);
    } catch (err) {
      console.error('bank change OTP resend failed:', err);
      throw new Error('We could not send the code. Try again in a few minutes.');
    }
    refresh();
    return { ok: true, message: 'A new code is on its way.' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not send a new code.' };
  }
}

export async function cancelBankChangeAction(formData: FormData): Promise<Result> {
  const owner = await requireSellerOwner();
  try {
    const request = await ownRequest(owner.sellerId, text(formData, 'requestId'));
    if (!request || !OPEN.includes(request.status as never)) throw new Error('This request is already closed.');
    await prisma.bankChangeRequest.update({ where: { id: request.id }, data: { status: BankChangeStatus.CANCELLED, otpHash: null } });
    await recordAudit({
      actor: { id: owner.userId, role: 'SELLER' },
      action: 'bank_change.cancelled',
      entityType: 'BankChangeRequest',
      entityId: request.id,
      summary: 'Cancelled a bank-detail change',
    });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not cancel.' };
  }
}
