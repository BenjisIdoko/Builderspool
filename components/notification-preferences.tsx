import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NotificationPreferences } from '@/lib/notifications/preferences';

type Props = {
  action: (formData: FormData) => Promise<unknown>;
  values: NotificationPreferences;
  /** The phone number on the account; text messages need one. */
  phone: string | null;
  /** Where a person adds a phone number elsewhere. Leave out to show the phone field here instead. */
  phoneHref?: string;
  /** Platform switches: a channel that is off is not offered. */
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  /** What the person is told they get by text message. */
  textEvents: string;
  /** Staff can see their owner's choices but not change them. */
  readOnly?: boolean;
};

const ROW =
  'flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 text-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-info-soft max-sm:min-h-11';

export function NotificationPreferences({ action, values, phone, phoneHref, smsEnabled, whatsappEnabled, textEvents, readOnly }: Props) {
  const channels = [
    { name: 'notifyEmail', label: 'Email', body: 'Every alert, sent to the email on your account.', on: values.notifyEmail, offered: true },
    { name: 'notifySms', label: 'Text message (SMS)', body: textEvents, on: values.notifySms, offered: smsEnabled },
    { name: 'notifyWhatsapp', label: 'WhatsApp', body: `${textEvents} Tick to agree to receive messages from BuildersPool on WhatsApp.`, on: values.notifyWhatsapp, offered: whatsappEnabled },
  ].filter((c) => c.offered);
  const hasTextChannel = channels.some((c) => c.name !== 'notifyEmail');
  const phoneHere = !phoneHref && hasTextChannel;
  const needsPhone = hasTextChannel && !phone && !phoneHere;

  return (
    <ActionForm action={action} successMessage="Saved." className="flex flex-col gap-2">
      <p className="mb-1 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Alerts always show in the app. Choose where else to receive them.
      </p>
      {channels.map((c) => (
        <label key={c.name} className={ROW}>
          <input type="checkbox" name={c.name} defaultChecked={c.on} disabled={readOnly} className="mt-0.5 size-4 shrink-0 accent-brand" />
          <span className="min-w-0">
            <span className="block font-semibold text-ink">{c.label}</span>
            <span className="block text-pretty text-xs text-muted-foreground">{c.body}</span>
          </span>
        </label>
      ))}
      {phoneHere && (
        <div className="mt-1 flex max-w-xs flex-col gap-1.5">
          <Label htmlFor="notify-phone" className="text-sm font-semibold text-ink">
            Phone number for text messages
          </Label>
          <Input id="notify-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08012345678" defaultValue={phone ?? ''} disabled={readOnly} />
        </div>
      )}
      {needsPhone && (
        <p role="status" className="text-pretty text-xs text-warning-text">
          Add a phone number to get text messages.{' '}
          <a href={phoneHref!} className="rounded-sm font-semibold underline outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Add it here
          </a>
        </p>
      )}
      {!readOnly && (
        <div className="mt-1">
          <Button type="submit" size="sm" className="max-sm:h-11">
            Save choices
          </Button>
        </div>
      )}
    </ActionForm>
  );
}
