import { NotificationType } from '@prisma/client';

// Which channels an alert may use. In-app is always on and is not decided here.
//
// Text messages (SMS and WhatsApp) cost money for every message, so they are kept for the
// events a person would want to act on straight away. Everything else stays in the app and
// in email, which is cheap.
const TEXT_EVENTS: ReadonlySet<NotificationType> = new Set([
  // Buyer: money and delivery.
  NotificationType.ORDER_PAID,
  NotificationType.ORDER_UPDATE,
  NotificationType.DISPATCH_UPDATE,
  NotificationType.PAYMENT_REMINDER,
  // Seller: offers that expire if nobody replies.
  NotificationType.BID_WON,
  NotificationType.SHEET_OFFERED,
  NotificationType.DIRECT_ORDER_RECEIVED,
  NotificationType.ACCEPT_REMINDER,
]);

export function isTextEvent(type: NotificationType): boolean {
  return TEXT_EVENTS.has(type);
}

export type ChannelPlan = { email: boolean; sms: boolean; whatsapp: boolean };

export function planChannels(input: {
  type: NotificationType;
  /** What the person chose in their account. */
  prefs: { notifyEmail: boolean; notifySms: boolean; notifyWhatsapp: boolean };
  hasEmail: boolean;
  hasPhone: boolean;
  /** Platform switches in Admin > Settings. */
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}): ChannelPlan {
  const text = input.hasPhone && isTextEvent(input.type);
  return {
    email: input.hasEmail && input.prefs.notifyEmail,
    sms: text && input.smsEnabled && input.prefs.notifySms,
    whatsapp: text && input.whatsappEnabled && input.prefs.notifyWhatsapp,
  };
}
