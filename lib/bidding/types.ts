export interface CycleCloseReport {
  cycleId: string;
  closedAt: Date;
  totalBidsConsidered: number;
  totalAllocationsCreated: number;
  totalQuantityAllocated: number;
  totalQuantityRequested: number;
  needsAttention: boolean;
}
