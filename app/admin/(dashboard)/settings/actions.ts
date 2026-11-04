'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin/session';
import { recordAudit } from '@/lib/audit';
import { SETTING_DEFINITIONS } from '@/lib/settings/definitions';
import { getSettings, parseSettingValue, validateSettingsSet, type SettingValues } from '@/lib/settings';

// Errors are returned as data (not thrown) so the form can show them — Next
// redacts a thrown Server Action message in production.
export async function updateSettingsAction(formData: FormData): Promise<{ error: string } | { saved: number }> {
  try {
    const admin = await requireAdminUser();

    const current = await getSettings();
    const next: SettingValues = {};
    for (const def of SETTING_DEFINITIONS) next[def.key] = parseSettingValue(def, formData.get(def.key));
    validateSettingsSet(next);

    const changed = SETTING_DEFINITIONS.filter((d) => next[d.key] !== current[d.key]);
    if (changed.length === 0) return { saved: 0 };

    await prisma.$transaction(
      changed.map((d) =>
        prisma.adminSetting.upsert({
          where: { key: d.key },
          create: { key: d.key, value: next[d.key], updatedById: admin.id },
          update: { value: next[d.key], updatedById: admin.id },
        }),
      ),
    );

    await recordAudit({
      actor: { id: admin.id, role: admin.role },
      action: 'settings.updated',
      entityType: 'AdminSetting',
      summary: `Changed ${changed.map((d) => d.label).join('; ')}`,
      metadata: Object.fromEntries(changed.map((d) => [d.key, { from: current[d.key], to: next[d.key] }])),
    });

    revalidatePath('/admin/settings');
    return { saved: changed.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not save settings.' };
  }
}
