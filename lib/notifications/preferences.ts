import { prisma } from '../prisma';

export interface NotificationPreferences {
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences & { phone: string | null }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { notifyEmail: true, notifySms: true, notifyWhatsapp: true, phone: true },
  });
  return user;
}

// A ticked box arrives in the form; an unticked one does not. Every channel is sent on every save.
export async function saveNotificationPreferences(userId: string, formData: FormData): Promise<void> {
  // The phone number is part of this form only where the person has nowhere else to set it (sellers).
  const rawPhone = formData.get('phone');
  let phone: { phone: string | null } | Record<string, never> = {};
  if (typeof rawPhone === 'string') {
    const trimmed = rawPhone.trim();
    if (trimmed && !/^\+?[\d\s-]{10,16}$/.test(trimmed)) {
      throw new Error('Enter a valid phone number, for example 08012345678.');
    }
    phone = { phone: trimmed || null };
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...phone,
      notifyEmail: formData.get('notifyEmail') === 'on',
      notifySms: formData.get('notifySms') === 'on',
      notifyWhatsapp: formData.get('notifyWhatsapp') === 'on',
    },
  });
}
