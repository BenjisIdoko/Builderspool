import { Prisma, type LedgerAccount } from '@prisma/client';
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

type Db = Pick<typeof prisma, 'ledgerEntry'>;

/** Posts one entry; returns false when that entryKey was already posted. */
export async function postLedgerEntry(posting: LedgerPosting, db: Db = prisma): Promise<boolean> {
  if (!Number.isSafeInteger(posting.amountKobo)) throw new Error('Ledger amounts must be whole kobo.');
  try {
    await db.ledgerEntry.create({
      data: {
        account: posting.account,
        amountKobo: BigInt(posting.amountKobo),
        entryKey: posting.entryKey,
        memo: posting.memo,
        orderId: posting.orderId,
        orderItemId: posting.orderItemId,
        allocationId: posting.allocationId,
        userId: posting.userId,
      },
    });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return false;
    throw err;
  }
}
