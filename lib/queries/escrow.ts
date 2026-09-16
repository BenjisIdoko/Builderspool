import { OrderStatus, PayoutStatus } from '@prisma/client';

export type EscrowStatus = 'FUNDING_PENDING' | 'FUNDS_LOCKED' | 'PARTIALLY_RELEASED' | 'RELEASED';

// Derives a real escrow state from two fields that already exist and are
// already correct — Order.status (buyer paid or not) and each
// Allocation.payoutStatus (has the fulfilling seller been disbursed yet).
// Deliberately not a new stored field: a duplicate "escrowStatus" column
// could drift out of sync with the real payment/payout state it's supposed
// to summarize. "Escrow" here is the honest name for a mechanism this app
// already has — buyer funds are held (Order.status === PAID) until a GRN
// clears a seller for payout (Allocation.payoutStatus PENDING_GRN ->
// PROCESSED -> PAID) — not a new subsystem bolted on top.
export function getEscrowStatus(order: {
  status: OrderStatus;
  items: { allocations: { payoutStatus: PayoutStatus }[] }[];
}): EscrowStatus {
  if (order.status !== OrderStatus.PAID) return 'FUNDING_PENDING';

  const allocations = order.items.flatMap((item) => item.allocations);
  if (allocations.length === 0) return 'FUNDS_LOCKED';

  const paidCount = allocations.filter((a) => a.payoutStatus === PayoutStatus.PAID).length;
  if (paidCount === 0) return 'FUNDS_LOCKED';
  if (paidCount === allocations.length) return 'RELEASED';
  return 'PARTIALLY_RELEASED';
}

export const ESCROW_STATUS_LABEL: Record<EscrowStatus, string> = {
  FUNDING_PENDING: 'Awaiting funding',
  FUNDS_LOCKED: 'Escrow locked',
  PARTIALLY_RELEASED: 'Partially released',
  RELEASED: 'Escrow released',
};
