import { SettingsForm } from '@/components/admin/settings-form';
import { SETTING_DEFINITIONS, SETTING_GROUPS } from '@/lib/settings/definitions';
import { getSettings } from '@/lib/settings';

export const metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const values = await getSettings();
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · system</div>
      <h1 className="mb-1 text-heading-lg text-ink">Settings</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        The rules the Pool &amp; Save cycle, fees and money switches run on. Every change is recorded in the audit log.
      </p>
      <SettingsForm groups={SETTING_GROUPS} definitions={SETTING_DEFINITIONS} values={values} />
    </div>
  );
}
