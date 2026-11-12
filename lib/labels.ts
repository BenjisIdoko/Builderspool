// One wording for the statuses people read on more than one screen. Sellers and
// buyers get plain words; the ops team keeps the warehouse terms they work in
// (GRN is the goods-received note a fulfilment centre issues).

/** Payout status, as a seller sees it. */
export const PAYOUT_LABEL: Record<string, string> = {
  PENDING_GRN: 'Awaiting receipt',
  PROCESSED: 'Being paid',
  PAID: 'Paid',
  ON_HOLD: 'On hold',
};

/** Payout status, as the ops team sees it. */
export const PAYOUT_LABEL_OPS: Record<string, string> = {
  PENDING_GRN: 'Awaiting GRN',
  PROCESSED: 'Cleared for payout',
  PAID: 'Disbursed',
  ON_HOLD: 'On hold',
};

/** Verification status, as a seller sees it. */
export const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not started',
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

/** Verification status, as the ops team sees it. */
export const KYC_LABEL_OPS: Record<string, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};
