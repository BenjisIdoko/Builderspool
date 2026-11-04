import { nairaToKobo } from '../money';

/**
 * What the buyer is owed back for units no supplier took: the goods at the
 * locked unit price plus the line's delivery charge in proportion to the
 * unfilled share, in whole kobo.
 */
export function refundDueKobo(
  line: { priceLocked: { toString(): string }; deliveryCost: { toString(): string }; quantity: number },
  unfilled: number,
): number {
  if (unfilled <= 0 || line.quantity <= 0) return 0;
  const goods = nairaToKobo(line.priceLocked) * unfilled;
  const delivery = Math.round((nairaToKobo(line.deliveryCost) * unfilled) / line.quantity);
  return goods + delivery;
}
