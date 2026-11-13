import { BankChangeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** True while a seller has a bank-detail change waiting for ops (the code is confirmed). */
export async function hasBankChangeUnderReview(sellerId: string): Promise<boolean> {
  return (await prisma.bankChangeRequest.count({ where: { sellerId, status: BankChangeStatus.PENDING_REVIEW } })) > 0;
}

// Money never goes out while the account it would go to is being changed. Called before every payout.
export async function assertNoBankChangeUnderReview(sellerId: string): Promise<void> {
  if (await hasBankChangeUnderReview(sellerId)) {
    throw new Error('This seller has a bank-detail change waiting for review. Review it first, then pay out.');
  }
}

/** "0123456789" -> "******6789", so a screen never shows a whole account number it doesn't need to. */
export function maskAccount(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '—';
  return accountNumber.length <= 4 ? accountNumber : `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
}
