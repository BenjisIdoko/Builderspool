'use client';

import { useState, useTransition } from 'react';
import { updateSettingsAction } from '@/app/admin/(dashboard)/settings/actions';
import type { SettingDefinition, SettingGroupId } from '@/lib/settings/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Group = { id: SettingGroupId; title: string; description: string };

export function SettingsForm({
  groups,
  definitions,
  values,
}: {
  groups: Group[];
  definitions: SettingDefinition[];
  values: Record<string, string | number | boolean>;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSettingsAction(formData);
      if ('error' in result) setMessage({ tone: 'error', text: result.error });
      else
        setMessage({
          tone: 'success',
          text: result.saved === 0 ? 'Nothing changed.' : `Saved ${result.saved} ${result.saved === 1 ? 'setting' : 'settings'}.`,
        });
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {groups.map((group) => (
        <section key={group.id} className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-bold text-slate">{group.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
            {definitions
              .filter((d) => d.group === group.id)
              .map((d) => (
                <div key={d.key} className={d.type === 'bool' ? 'flex items-start gap-3 sm:col-span-2' : ''}>
                  {d.type === 'bool' ? (
                    <>
                      <input
                        id={d.key}
                        name={d.key}
                        type="checkbox"
                        defaultChecked={Boolean(values[d.key])}
                        className="mt-0.5 size-4 accent-[var(--color-brand)]"
                      />
                      <div>
                        <Label htmlFor={d.key} className="text-sm text-ink">
                          {d.label}
                        </Label>
                        {d.help && <p className="text-xs text-muted-foreground">{d.help}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <Label htmlFor={d.key} className="mb-1.5 text-xs text-muted-foreground">
                        {d.label}
                      </Label>
                      <Input
                        id={d.key}
                        name={d.key}
                        required
                        type={d.type === 'time' ? 'time' : d.type === 'text' ? 'text' : 'number'}
                        min={d.min}
                        max={d.max}
                        step={d.type === 'int' || d.type === 'percent' ? 1 : undefined}
                        defaultValue={String(values[d.key])}
                      />
                      {d.help && <p className="mt-1 text-xs text-muted-foreground">{d.help}</p>}
                    </>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}

      <div className="flex items-center justify-end gap-4">
        {message && (
          <p className={`text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role="status">
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}
