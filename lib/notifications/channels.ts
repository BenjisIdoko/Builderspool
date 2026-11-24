import { NotificationChannel, NotificationDeliveryStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { sendNotificationEmail } from '../email/send';

// Normalizes a Nigerian phone number (e.g. 08012345678 or +2348012345678) to
// international format without the leading + (2348012345678).
export function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  return digits;
}

interface OutboundResult {
  status: NotificationDeliveryStatus;
  providerRef?: string;
  error?: string;
}

async function sendSmsMessage(phone: string, text: string): Promise<OutboundResult> {
  const intl = toInternationalPhone(phone);
  // Termii (primary Nigerian SMS gateway)
  if (process.env.TERMII_API_KEY) {
    try {
      const res = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: intl,
          from: process.env.TERMII_SENDER_ID ?? 'BuildersPl',
          sms: text,
          type: 'plain',
          channel: 'generic',
          api_key: process.env.TERMII_API_KEY,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message_id?: string; message?: string };
      if (!res.ok) {
        return { status: NotificationDeliveryStatus.FAILED, error: data.message ?? `Termii HTTP ${res.status}` };
      }
      return { status: NotificationDeliveryStatus.SENT, providerRef: data.message_id };
    } catch (err) {
      return { status: NotificationDeliveryStatus.FAILED, error: err instanceof Error ? err.message : 'SMS request failed' };
    }
  }

  // Twilio SMS fallback
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams({
        To: `+${intl}`,
        From: process.env.TWILIO_SMS_FROM,
        Body: text,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!res.ok) {
        return { status: NotificationDeliveryStatus.FAILED, error: data.message ?? `Twilio SMS HTTP ${res.status}` };
      }
      return { status: NotificationDeliveryStatus.SENT, providerRef: data.sid };
    } catch (err) {
      return { status: NotificationDeliveryStatus.FAILED, error: err instanceof Error ? err.message : 'Twilio SMS failed' };
    }
  }

  return { status: NotificationDeliveryStatus.SKIPPED_NO_PROVIDER };
}

async function sendWhatsAppMessage(phone: string, text: string): Promise<OutboundResult> {
  const intl = toInternationalPhone(phone);

  // Meta WhatsApp Cloud API
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: intl,
          type: 'text',
          text: { body: text },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        messages?: { id?: string }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        return {
          status: NotificationDeliveryStatus.FAILED,
          error: data.error?.message ?? `WhatsApp Cloud HTTP ${res.status}`,
        };
      }
      return { status: NotificationDeliveryStatus.SENT, providerRef: data.messages?.[0]?.id };
    } catch (err) {
      return { status: NotificationDeliveryStatus.FAILED, error: err instanceof Error ? err.message : 'WhatsApp Cloud failed' };
    }
  }

  // Twilio WhatsApp fallback
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const from = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_FROM
        : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
      const params = new URLSearchParams({
        To: `whatsapp:+${intl}`,
        From: from,
        Body: text,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!res.ok) {
        return { status: NotificationDeliveryStatus.FAILED, error: data.message ?? `Twilio WhatsApp HTTP ${res.status}` };
      }
      return { status: NotificationDeliveryStatus.SENT, providerRef: data.sid };
    } catch (err) {
      return { status: NotificationDeliveryStatus.FAILED, error: err instanceof Error ? err.message : 'Twilio WhatsApp failed' };
    }
  }

  // Termii WhatsApp fallback
  if (process.env.TERMII_API_KEY && process.env.TERMII_WHATSAPP_DEVICE_ID) {
    try {
      const res = await fetch('https://api.ng.termii.com/api/send/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: intl,
          from: process.env.TERMII_WHATSAPP_DEVICE_ID,
          sms: text,
          type: 'plain',
          channel: 'whatsapp',
          api_key: process.env.TERMII_API_KEY,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message_id?: string; message?: string };
      if (!res.ok) {
        return { status: NotificationDeliveryStatus.FAILED, error: data.message ?? `Termii WhatsApp HTTP ${res.status}` };
      }
      return { status: NotificationDeliveryStatus.SENT, providerRef: data.message_id };
    } catch (err) {
      return { status: NotificationDeliveryStatus.FAILED, error: err instanceof Error ? err.message : 'Termii WhatsApp failed' };
    }
  }

  return { status: NotificationDeliveryStatus.SKIPPED_NO_PROVIDER };
}

async function sendEmailChannel(
  to: string,
  title: string,
  body: string,
  link?: string,
): Promise<OutboundResult> {
  if (!process.env.RESEND_API_KEY) {
    return { status: NotificationDeliveryStatus.SKIPPED_NO_PROVIDER };
  }
  try {
    await sendNotificationEmail({ to, title, body, link });
    return { status: NotificationDeliveryStatus.SENT };
  } catch (err) {
    return {
      status: NotificationDeliveryStatus.FAILED,
      error: err instanceof Error ? err.message : 'Email send failed',
    };
  }
}

export interface MultiChannelPayload {
  userId: string;
  notificationId?: string;
  title: string;
  body: string;
  link?: string;
  /** Optional base key to prevent duplicate deliveries across Email, SMS, and WhatsApp. */
  dedupeKey?: string;
}

/**
 * Dispatches an event across Email, SMS, and WhatsApp for a user, logging every
 * attempt to NotificationDelivery. Best-effort: never throws to the caller so
 * transactional flows (checkout, pooling, GRN, dispatch) are never blocked.
 */
export async function deliverMultiChannel(payload: MultiChannelPayload): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, phone: true, disabledAt: true },
    });
    if (!user || user.disabledAt) return;

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://builderspool.vercel.app').replace(/\/$/, '');
    const fullLink = payload.link
      ? payload.link.startsWith('http')
        ? payload.link
        : `${appUrl}${payload.link.startsWith('/') ? '' : '/'}${payload.link}`
      : undefined;

    const textMessage = fullLink
      ? `BuildersPool: ${payload.title} — ${payload.body} ${fullLink}`
      : `BuildersPool: ${payload.title} — ${payload.body}`;

    const tasks: Promise<void>[] = [];

    if (user.email) {
      tasks.push(
        (async () => {
          const emailKey = payload.dedupeKey ? `${payload.dedupeKey}:EMAIL` : undefined;
          if (emailKey) {
            const exists = await prisma.notificationDelivery.findUnique({ where: { dedupeKey: emailKey } });
            if (exists) return;
          }
          const res = await sendEmailChannel(user.email, payload.title, payload.body, fullLink);
          await prisma.notificationDelivery
            .create({
              data: {
                userId: payload.userId,
                notificationId: payload.notificationId,
                channel: NotificationChannel.EMAIL,
                recipient: user.email,
                subject: payload.title,
                body: payload.body,
                status: res.status,
                providerRef: res.providerRef,
                error: res.error,
                dedupeKey: emailKey,
              },
            })
            .catch(() => {});
        })(),
      );
    }

    if (user.phone && user.phone.trim()) {
      const phone = user.phone.trim();
      tasks.push(
        (async () => {
          const smsKey = payload.dedupeKey ? `${payload.dedupeKey}:SMS` : undefined;
          if (smsKey) {
            const exists = await prisma.notificationDelivery.findUnique({ where: { dedupeKey: smsKey } });
            if (exists) return;
          }
          const res = await sendSmsMessage(phone, textMessage);
          await prisma.notificationDelivery
            .create({
              data: {
                userId: payload.userId,
                notificationId: payload.notificationId,
                channel: NotificationChannel.SMS,
                recipient: phone,
                body: textMessage,
                status: res.status,
                providerRef: res.providerRef,
                error: res.error,
                dedupeKey: smsKey,
              },
            })
            .catch(() => {});
        })(),
        (async () => {
          const waKey = payload.dedupeKey ? `${payload.dedupeKey}:WHATSAPP` : undefined;
          if (waKey) {
            const exists = await prisma.notificationDelivery.findUnique({ where: { dedupeKey: waKey } });
            if (exists) return;
          }
          const res = await sendWhatsAppMessage(phone, textMessage);
          await prisma.notificationDelivery
            .create({
              data: {
                userId: payload.userId,
                notificationId: payload.notificationId,
                channel: NotificationChannel.WHATSAPP,
                recipient: phone,
                body: textMessage,
                status: res.status,
                providerRef: res.providerRef,
                error: res.error,
                dedupeKey: waKey,
              },
            })
            .catch(() => {});
        })(),
      );
    }

    await Promise.allSettled(tasks);
  } catch (err) {
    console.error('Multi-channel delivery error:', err);
  }
}
