import { CycleStatus, BidStatus, AllocationStatus } from '@prisma/client';

export interface AggregatedMaterialDemand {
  materialId: string;
  materialName: string;
  category: string;
  unit: string;
  totalQuantity: number;
  buyerCount: number;
}

export interface CycleDemandSummary {
  cycleId: string;
  date: Date;
  status: CycleStatus;
  cutoffAt: Date;
  totalMaterials: number;
  totalQuantityNeeded: number;
  demands: AggregatedMaterialDemand[];
}

export interface AllocationDetail {
  bidId: string;
  cartItemId: string;
  materialId: string;
  quantityFilled: number;
  pricePerUnit: number;
}

export interface CycleResolutionReport {
  cycleId: string;
  resolvedAt: Date;
  totalBidsProcessed: number;
  totalAllocationsCreated: number;
  totalQuantityAllocated: number;
  allocations: AllocationDetail[];
}
