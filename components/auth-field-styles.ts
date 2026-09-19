// One source of truth for auth-form controls (login, signup, forgot/reset
// password, all three roles). 48px tall on phones, 44px from sm up, with
// 16px text so iOS Safari doesn't zoom the page when a field is focused —
// the shared Input's 32px/14px default is too small for a thumb.
export const AUTH_INPUT =
  'h-12 rounded-lg px-4 text-base sm:h-11 md:text-base';
export const AUTH_LABEL = 'mb-2 text-sm font-medium text-slate';
export const AUTH_BUTTON = 'h-12 w-full rounded-full text-base font-bold sm:h-11';
export const AUTH_SELECT =
  'h-12 w-full rounded-lg border border-input bg-transparent px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-11';
