import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { SETTING_BY_KEY, SETTING_DEFINITIONS, type SettingDefinition } from './definitions';

export type SettingValues = Record<string, string | number | boolean>;

// Defaults merged with whatever admins have saved. Cached per request.
export const getSettings = cache(async (): Promise<SettingValues> => {
  const rows = await prisma.adminSetting.findMany();
  const values: SettingValues = Object.fromEntries(SETTING_DEFINITIONS.map((d) => [d.key, d.default]));
  for (const row of rows) {
    const def = SETTING_BY_KEY[row.key];
    if (def && typeof row.value === typeof def.default) values[row.key] = row.value as string | number | boolean;
  }
  return values;
});

export async function getSetting<T extends string | number | boolean>(key: string): Promise<T> {
  if (!SETTING_BY_KEY[key]) throw new Error(`Unknown setting ${key}.`);
  return (await getSettings())[key] as T;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Parses one submitted form value into the setting's type, or throws a message
// an admin can read.
export function parseSettingValue(def: SettingDefinition, raw: FormDataEntryValue | null): string | number | boolean {
  if (def.type === 'bool') return raw === 'on' || raw === 'true';
  if (typeof raw !== 'string' || raw.trim() === '') throw new Error(`${def.label} is required.`);
  const text = raw.trim();
  if (def.type === 'time') {
    if (!TIME_RE.test(text)) throw new Error(`${def.label} must be a time like 17:00.`);
    return text;
  }
  if (def.type === 'text') {
    if (text.length > 40) throw new Error(`${def.label} is too long.`);
    return text;
  }
  const n = Number(text);
  if (!Number.isInteger(n)) throw new Error(`${def.label} must be a whole number.`);
  if (def.min !== undefined && n < def.min) throw new Error(`${def.label} must be at least ${def.min}.`);
  if (def.max !== undefined && n > def.max) throw new Error(`${def.label} must be at most ${def.max}.`);
  return n;
}

// Rules that span several settings.
export function validateSettingsSet(values: SettingValues): void {
  const weightKeys = SETTING_DEFINITIONS.filter((d) => d.key.endsWith('Weight')).map((d) => d.key);
  const total = weightKeys.reduce((sum, k) => sum + Number(values[k]), 0);
  if (total !== 100) throw new Error(`The six scoring weights add up to ${total}; they must add up to 100.`);

  const order = ['cycle.poolCloseTime', 'cycle.bidCloseTime', 'cycle.acceptDeadlineTime', 'cycle.fallbackTime'];
  for (let i = 1; i < order.length; i++) {
    if (String(values[order[i]]) < String(values[order[i - 1]])) {
      throw new Error(`${SETTING_BY_KEY[order[i]].label} cannot be earlier than ${SETTING_BY_KEY[order[i - 1]].label.toLowerCase()}.`);
    }
  }
}
