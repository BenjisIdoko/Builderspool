// What a buyer sees about one order line once it is paid, in plain words. Pure (no
// database, no clock) so every state can be tested on plain data. Returns null for
// lines pooled under the older per-material cycles, whose tracking is unchanged.

export type LineTone = 'info' | 'success' | 'warning' | 'danger';

export interface LineStatus {
  tone: LineTone;
  label: string;
  detail?: string;
}

export interface LineStatusInput {
  quantity: number;
  unfilledQuantity: number;
  sheetLine: { sheet: { status: 'OPEN' | 'BIDDING' | 'AWARDING' | 'AWARDED' | 'CANCELLED'; poolClosesAt: Date; bidsCloseAt: Date; rank3EndsAt: Date } } | null;
  sheetFulfilment: { status: 'PENDING' | 'FULFILLED' | 'FAILED'; savingsWalletEntry: { buyerShare: number } | null } | null;
  direct: { status: 'AWAITING_ACCEPT' | 'ACCEPTED' | 'FULFILLED' | 'DECLINED' | 'EXPIRED'; acceptDeadlineAt: Date } | null;
}

const time = (d: Date) => d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' });
const dateTime = (d: Date) => d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' });
const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

/** True when no supplier took the line and the buyer is owed it back. */
export function isRefundedLine(item: Pick<LineStatusInput, 'quantity' | 'unfilledQuantity'>): boolean {
  return item.quantity > 0 && item.unfilledQuantity >= item.quantity;
}

export function describeLine(item: LineStatusInput, orderPaid: boolean): LineStatus | null {
  if (!orderPaid) return null;
  const { sheetLine, sheetFulfilment, direct } = item;
  const revertedFromSheet = sheetLine?.sheet.status === 'CANCELLED' || sheetFulfilment?.status === 'FAILED';
  const sentBack = revertedFromSheet ? 'No supplier took the pool, so your order went to the seller you chose, at the price you paid. ' : '';

  if (isRefundedLine(item)) {
    const why =
      direct?.status === 'DECLINED' ? 'The seller you chose declined this line.' : direct?.status === 'EXPIRED' ? 'The seller you chose did not accept in time.' : direct ? 'The seller you chose could not supply it.' : revertedFromSheet ? 'No supplier could supply it.' : undefined;
    return { tone: 'danger', label: 'Not supplied: refund due', detail: [sentBack && direct ? sentBack.trim() : '', why].filter(Boolean).join(' ') || undefined };
  }

  if (sheetFulfilment && sheetFulfilment.status !== 'FAILED') {
    if (sheetFulfilment.status === 'FULFILLED') {
      const saving = sheetFulfilment.savingsWalletEntry?.buyerShare;
      return { tone: 'success', label: 'Received and checked', detail: saving ? `Your share of the saving, ${naira(saving)}, has been credited to your savings wallet.` : undefined };
    }
    return { tone: 'info', label: 'Supplier confirmed', detail: 'The goods are on their way to the fulfilment centre.' };
  }

  if (direct) {
    switch (direct.status) {
      case 'AWAITING_ACCEPT':
        return { tone: 'warning', label: 'Waiting for the seller to accept', detail: `${sentBack}They have until ${dateTime(direct.acceptDeadlineAt)}; if they cannot supply it you are refunded.` };
      case 'ACCEPTED':
        return { tone: 'info', label: 'Seller accepted', detail: `${sentBack}They are preparing your goods for the fulfilment centre.` };
      case 'FULFILLED':
        return { tone: 'success', label: 'Received and checked', detail: sentBack.trim() || undefined };
      default:
        return null; // DECLINED / EXPIRED are covered by the refund branch above
    }
  }

  if (sheetLine) {
    const s = sheetLine.sheet;
    switch (s.status) {
      case 'OPEN':
        return { tone: 'info', label: 'In today’s pool', detail: `The pool closes at ${time(s.poolClosesAt)}; then suppliers bid for it.` };
      case 'BIDDING':
        return { tone: 'info', label: 'Suppliers are bidding', detail: `Bidding closes at ${time(s.bidsCloseAt)}.` };
      case 'AWARDING':
        return { tone: 'info', label: 'Choosing a supplier', detail: `The result is due by ${time(s.rank3EndsAt)}.` };
      case 'AWARDED':
        return { tone: 'info', label: 'Supplier confirmed', detail: 'The goods are on their way to the fulfilment centre.' };
      case 'CANCELLED':
        return { tone: 'warning', label: 'Sending to the seller you chose', detail: 'No supplier took the pool, so it goes to the seller you chose, at the price you paid.' };
    }
  }
  return null;
}
