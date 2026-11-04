// Fills a cycle's demand from ranked bids, rank-first, splitting across sellers
// when the top bid can't cover it alone — and never letting more than
// `maxWinners` distinct suppliers win in a category and zone (Transfer File
// 5.5). Pure: the database layer (award.ts) gathers the inputs and writes the
// result.

export interface RankedBidSlot {
  bidId: string;
  sellerId: string;
  capacity: number; // quantity offered
}

export interface DemandLine {
  id: string;
  quantity: number;
}

export interface AllocationPlan {
  allocations: { bidId: string; sellerId: string; orderItemId: string; quantity: number }[];
  filledByBid: Map<string, number>;
  winners: Set<string>; // seller ids, including any winners already counted
  cappedBidIds: Set<string>; // bids skipped only because of the winner cap
  unfilledByItem: Map<string, number>;
}

export function allocateDemand(
  lines: DemandLine[],
  rankedBids: RankedBidSlot[],
  options: { maxWinners: number; existingWinners?: Iterable<string> },
): AllocationPlan {
  const winners = new Set<string>(options.existingWinners ?? []);
  const remaining = new Map(rankedBids.map((b) => [b.bidId, b.capacity]));
  const filledByBid = new Map<string, number>();
  const cappedBidIds = new Set<string>();
  const unfilledByItem = new Map<string, number>();
  const allocations: AllocationPlan['allocations'] = [];

  for (const line of lines) {
    let need = line.quantity;
    for (const slot of rankedBids) {
      if (need <= 0) break;
      const capacity = remaining.get(slot.bidId) ?? 0;
      if (capacity <= 0) continue;

      if (!winners.has(slot.sellerId) && winners.size >= options.maxWinners) {
        cappedBidIds.add(slot.bidId);
        continue;
      }

      const quantity = Math.min(need, capacity);
      allocations.push({ bidId: slot.bidId, sellerId: slot.sellerId, orderItemId: line.id, quantity });
      remaining.set(slot.bidId, capacity - quantity);
      filledByBid.set(slot.bidId, (filledByBid.get(slot.bidId) ?? 0) + quantity);
      winners.add(slot.sellerId);
      need -= quantity;
    }
    if (need > 0) unfilledByItem.set(line.id, need);
  }

  // A bid skipped for the cap that later got nothing is the one the cap cost.
  for (const id of [...cappedBidIds]) if ((filledByBid.get(id) ?? 0) > 0) cappedBidIds.delete(id);

  return { allocations, filledByBid, winners, cappedBidIds, unfilledByItem };
}
