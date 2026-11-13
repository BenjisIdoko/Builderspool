import { BankChangeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SELLER = { select: { name: true, businessName: true, email: true, phone: true } } as const;

export type BankChangeRow = Awaited<ReturnType<typeof getBankChangeQueue>>['waiting'][number];

// Requests ops still have to decide, oldest first, and the last few decisions for context.
export async function getBankChangeQueue() {
  const [waiting, decided, openCodes] = await Promise.all([
    prisma.bankChangeRequest.findMany({ where: { status: BankChangeStatus.PENDING_REVIEW }, include: { seller: SELLER }, orderBy: { createdAt: 'asc' } }),
    prisma.bankChangeRequest.findMany({
      where: { status: { in: [BankChangeStatus.APPROVED, BankChangeStatus.REJECTED] } },
      include: { seller: SELLER },
      orderBy: { reviewedAt: 'desc' },
      take: 5,
    }),
    prisma.bankChangeRequest.count({ where: { status: BankChangeStatus.OTP_PENDING } }),
  ]);
  return { waiting, decided, openCodes };
}
