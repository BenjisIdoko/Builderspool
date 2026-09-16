import { AllocationStatus, BidStatus, CycleStatus, OrderStatus, PayoutStatus } from '@prisma/client';

// One shared 4-category pill system (success / warning / info / danger),
// light background + saturated text, never a solid fill — per the
// Fable/Design handoff's status-pill spec. Every status enum in the app
// maps into this same visual language instead of each page inventing its
// own badge palette.
export type PillTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const TONE_CLASS: Record<PillTone, string> = {
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  neutral: 'bg-transparent text-slate border-border',
};

export function pillClass(tone: PillTone) {
  return TONE_CLASS[tone];
}

export function orderStatusTone(status: OrderStatus): PillTone {
  switch (status) {
    case OrderStatus.PAID:
      return 'success';
    case OrderStatus.PENDING_PAYMENT:
      return 'warning';
    case OrderStatus.CANCELLED:
      return 'danger';
  }
}

export function cycleStatusTone(status: CycleStatus): PillTone {
  switch (status) {
    case CycleStatus.OPEN:
      return 'success';
    case CycleStatus.CLOSED:
      return 'warning';
    case CycleStatus.AWARDED:
      return 'info';
  }
}

export function bidStatusTone(status: BidStatus): PillTone {
  switch (status) {
    case BidStatus.FILLED:
      return 'success';
    case BidStatus.PARTIALLY_FILLED:
    case BidStatus.SUBMITTED:
      return 'info';
    case BidStatus.REJECTED:
    case BidStatus.WITHDRAWN:
      return 'danger';
  }
}

export function allocationStatusTone(status: AllocationStatus): PillTone {
  switch (status) {
    case AllocationStatus.FULFILLED:
      return 'success';
    case AllocationStatus.CONFIRMED:
    case AllocationStatus.PENDING:
      return 'warning';
    case AllocationStatus.CANCELLED:
      return 'danger';
  }
}

export function payoutStatusTone(status: PayoutStatus): PillTone {
  switch (status) {
    case PayoutStatus.PAID:
      return 'success';
    case PayoutStatus.PROCESSED:
      return 'info';
    case PayoutStatus.PENDING_GRN:
      return 'warning';
    case PayoutStatus.ON_HOLD:
      return 'danger';
  }
}

// Real derived stage titles from getOrderTrackingStages() (lib/queries/orders.ts)
// — matched by title text since those titles are the actual real values
// stored/rendered, not a separate enum. Later stages read as "more done"
// (success), earlier ones as "still moving" (info/warning), keeping the
// same visual grammar as every other status pill in the app.
export function fulfillmentStageTone(title: string): PillTone {
  switch (title) {
    case 'Delivered':
    case 'Picked up':
      return 'success';
    case 'Out for delivery':
    case 'Ready for pickup':
      return 'info';
    case 'Supplier assigned':
    case 'Demand pooled':
      return 'warning';
    default:
      return 'neutral';
  }
}
