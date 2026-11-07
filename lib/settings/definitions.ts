// Every admin-editable platform setting, with its default. A key with no row
// in AdminSetting uses `default`, so these values apply on a fresh database.
// Defaults follow the BuildersPool Transfer File (section 4/5): change them
// here only if that file changes; admins change live values in Admin > Settings.
export type SettingType = 'time' | 'int' | 'percent' | 'bool' | 'text';

export interface SettingDefinition {
  key: string;
  label: string;
  group: SettingGroupId;
  type: SettingType;
  default: string | number | boolean;
  help?: string;
  min?: number;
  max?: number;
}

export type SettingGroupId = 'cycle' | 'sheets' | 'scoring' | 'pool' | 'fees' | 'money' | 'accounts';

export const SETTING_GROUPS: { id: SettingGroupId; title: string; description: string }[] = [
  {
    id: 'cycle',
    title: 'Pool & Save daily cycle',
    description: 'Times are Africa/Lagos. Each must come after the one before it.',
  },
  {
    id: 'sheets',
    title: 'Category sheets (new pooling engine)',
    description:
      'Orders pool by category and delivery zone. Times are Africa/Lagos. Bids close plus three accept windows must equal the final result time.',
  },
  {
    id: 'scoring',
    title: 'Bid scoring weights',
    description: 'How each bid is scored. The six weights must add up to 100.',
  },
  { id: 'pool', title: 'Pool rules', description: 'Limits on who can win and what counts as a valid pool.' },
  { id: 'fees', title: 'Fees and savings split', description: 'BuildersPool income lines.' },
  { id: 'money', title: 'Money movement', description: 'Switches for payouts and wallet withdrawals.' },
  { id: 'accounts', title: 'Seller accounts', description: 'Onboarding and document rules.' },
];

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  { key: 'cycle.poolCloseTime', label: 'Pool closes (demand frozen, RFQs issued)', group: 'cycle', type: 'time', default: '17:00' },
  { key: 'cycle.bidCloseTime', label: 'Blind bidding closes (scoring and award run then)', group: 'cycle', type: 'time', default: '18:00' },
  { key: 'cycle.acceptDeadlineTime', label: 'Unaccepted awards pass to next-ranked bid', group: 'cycle', type: 'time', default: '19:00' },
  { key: 'cycle.fallbackTime', label: 'Final result (unfilled lines marked unsuccessful and refunded)', group: 'cycle', type: 'time', default: '19:50' },

  { key: 'sheets.enabled', label: 'Pool new orders onto category sheets', group: 'sheets', type: 'bool', default: false, help: 'Off: paid pool orders use the older per-material cycles. Leave off until the sheet engine is complete; sheets already open keep running either way.' },
  { key: 'sheets.poolCloseTime', label: 'Pool closes (demand frozen, reference prices fixed)', group: 'sheets', type: 'time', default: '12:00' },
  { key: 'sheets.bidCloseTime', label: 'Bids close (bids checked, awards start)', group: 'sheets', type: 'time', default: '15:00' },
  { key: 'sheets.acceptWindowMinutes', label: 'Minutes each ranked vendor has to accept', group: 'sheets', type: 'int', default: 60, min: 15, max: 240, help: 'Rank 1, then rank 2, then rank 3, one window each.' },
  { key: 'sheets.finalTime', label: 'Final result (unaccepted lines revert or refund)', group: 'sheets', type: 'time', default: '18:00', help: 'Must equal bids close plus three accept windows.' },

  { key: 'scoring.priceWeight', label: 'Landed price (unit + delivery)', group: 'scoring', type: 'int', default: 30, min: 0, max: 100 },
  { key: 'scoring.performanceWeight', label: 'Historical performance', group: 'scoring', type: 'int', default: 20, min: 0, max: 100 },
  { key: 'scoring.capacityWeight', label: 'Quantity and capacity', group: 'scoring', type: 'int', default: 20, min: 0, max: 100 },
  { key: 'scoring.deliveryWeight', label: 'Delivery speed / SLA', group: 'scoring', type: 'int', default: 15, min: 0, max: 100 },
  { key: 'scoring.geographyWeight', label: 'Geographic suitability', group: 'scoring', type: 'int', default: 10, min: 0, max: 100 },
  { key: 'scoring.responsivenessWeight', label: 'Bid responsiveness and completeness', group: 'scoring', type: 'int', default: 5, min: 0, max: 100 },
  { key: 'scoring.newSupplierNeutralScore', label: 'Performance score for new suppliers (out of 100)', group: 'scoring', type: 'int', default: 50, min: 0, max: 100 },
  { key: 'scoring.newSupplierMinOrders', label: 'Completed orders before a supplier is scored on history', group: 'scoring', type: 'int', default: 5, min: 0, max: 100 },

  { key: 'pool.maxWinnersPerCategoryZone', label: 'Maximum winning suppliers per category per zone', group: 'pool', type: 'int', default: 5, min: 1, max: 50 },
  { key: 'pool.minEligibleBidsPerLine', label: 'Minimum eligible bids needed to award a pool line', group: 'pool', type: 'int', default: 1, min: 1, max: 10, help: 'Open decision in the transfer file: 1 or 2.' },

  { key: 'areas.checkoutPickerEnabled', label: 'Checkout: buyers pick their locality and zone', group: 'pool', type: 'bool', default: false, help: 'Turn on once every zone you deliver to has a delivery fee. Off: checkout uses the old region-based delivery charge.' },
  { key: 'direct.acceptWindowHours', label: 'Buy Direct: hours a seller has to accept an order line', group: 'pool', type: 'int', default: 24, min: 1, max: 168, help: 'A line the seller does not accept in time is refunded to the buyer.' },

  { key: 'fees.buyDirectCommissionPct', label: 'Buy Direct commission (%)', group: 'fees', type: 'percent', default: 3, min: 0, max: 100 },
  { key: 'fees.poolSavingsBuyerSharePct', label: "Buyer's share of verified Pool & Save savings (%)", group: 'fees', type: 'percent', default: 50, min: 0, max: 100, help: 'BuildersPool keeps the rest. Any odd kobo goes to the buyer.' },

  { key: 'money.walletWithdrawalsEnabled', label: 'Allow savings-credit withdrawals', group: 'money', type: 'bool', default: false, help: 'Disabled in the MVP; the balance is a "savings credit".' },
  { key: 'money.sellerPayoutsEnabled', label: 'Allow seller payouts', group: 'money', type: 'bool', default: false, help: 'Disabled in the MVP until Paystack is live and reviewed.' },

  { key: 'accounts.termsVersion', label: 'Current seller terms version', group: 'accounts', type: 'text', default: 'v1', help: 'Changing this asks every seller to accept the new terms.' },
  { key: 'accounts.documentExpiryWarnDays', label: 'Warn about expiring documents (days before)', group: 'accounts', type: 'int', default: 30, min: 1, max: 365 },
];

export const SETTING_BY_KEY: Record<string, SettingDefinition> = Object.fromEntries(
  SETTING_DEFINITIONS.map((d) => [d.key, d]),
);
