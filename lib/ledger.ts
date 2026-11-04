import type { LedgerAccount, Prisma } from '@prisma/client';
import { prisma } from './prisma';

// Append-only money ledger (Transfer File, section 4). Rows are never updated
// or deleted — a database trigger refuses both — so a correction is a new,
// opposite entry. Amounts are integer kobo; a positive amount adds to the
// account, a negative one reduces it.
//
// `entryKey` makes every posting idempotent: the same business event always
// produces the same key, so a retried tick or a double-click can't post it
// twice.
export interface LedgerPosting {
  account: LedgerAccount;
  amountKobo: number;
  entryKey: string;
  memo: string;
  orderId?: string;
  orderItemId?: string;
  allocationId?: string;
  userId?: string;
}

type Db = Pick<Prisma.TransactionClient, 'ledgerEntry'>;

/**
 * Posts one entry; returns false when that entryKey was already posted.
 * Uses ON CONFLICT DO NOTHING (skipDuplicates) rather than catching a unique
 * violation, which would abort an enclosing database transaction.
 */
export async function postLedgerEntry(posting: LedgerPosting, db: Db = prisma): Promise<boolean> {
  if (!Number.isSafeInteger(posting.amountKobo)) throw new Error('Ledger amounts must be whole kobo.');
  const { count } = await db.ledgerEntry.createMany({
    data: [
      {
        account: posting.account,
        amountKobo: BigInt(posting.amountKobo),
        entryKey: posting.entryKey,
        memo: posting.memo,
        orderId: posting.orderId,
        orderItemId: posting.orderItemId,
        allocationId: posting.allocationId,
        userId: posting.userId,
      },
    ],
    skipDuplicates: true,
  });
  return count === 1;
}
