'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type ActionConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  /** Red confirm button, for something that can't be undone. */
  destructive?: boolean;
};

type ActionResult = { error?: string } | void | null | undefined | { ok?: boolean };

// A form that calls a server action and shows what went wrong beside its
// buttons, instead of leaving the person on an error page. With `confirm`, the
// submit first asks, in a dialog, before anything happens. Buttons and fields
// inside are disabled while the action runs.
export function ActionForm({
  action,
  confirm,
  successMessage,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult | unknown>;
  confirm?: ActionConfirm;
  /** Shown after the action succeeds. */
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);
  const held = useRef<FormData | null>(null);

  function run(fd: FormData) {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = (await action(fd)) as { error?: string } | undefined | null;
      if (result && typeof result === 'object' && typeof result.error === 'string') setError(result.error);
      else setDone(true);
      setOpen(false);
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (confirm) {
      held.current = fd;
      setOpen(true);
    } else {
      run(fd);
    }
  }

  return (
    <form onSubmit={submit} className={className} aria-busy={isPending}>
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>
      {error && !open && (
        <p role="alert" className="mt-1 basis-full text-pretty text-caption text-danger">
          {error}
        </p>
      )}
      {done && !error && successMessage && (
        <p role="status" className="mt-1 basis-full text-pretty text-caption text-success">
          {successMessage}
        </p>
      )}
      {confirm && (
        <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{confirm.title}</DialogTitle>
              <DialogDescription className="text-pretty">{confirm.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirm.destructive ? 'destructive' : 'default'}
                disabled={isPending}
                aria-busy={isPending}
                onClick={() => held.current && run(held.current)}
              >
                {isPending ? 'Working…' : confirm.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </form>
  );
}
