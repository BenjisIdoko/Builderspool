'use client';

import { useState, useTransition } from 'react';
import { reissueStaffInviteAction, removeStaffAction } from '@/app/seller/(dashboard)/team/actions';
import { InviteLinkPanel } from '@/components/seller/invite-link-panel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// The buttons for one staff row. Renders as flex children of the row, so the
// invite link panel can take the full row width underneath the buttons.
export function StaffActions({ staffUserId, name, invitePending }: { staffUserId: string; name: string; invitePending: boolean }) {
  const [issuing, startIssue] = useTransition();
  const [removing, startRemove] = useTransition();
  const [invite, setInvite] = useState<{ name: string; inviteUrl: string } | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function issue() {
    setIssueError(null);
    const fd = new FormData();
    fd.set('staffUserId', staffUserId);
    startIssue(async () => {
      const r = await reissueStaffInviteAction(fd);
      if ('error' in r) setIssueError(r.error);
      else setInvite({ name: r.name, inviteUrl: r.inviteUrl });
    });
  }

  function remove() {
    setRemoveError(null);
    const fd = new FormData();
    fd.set('staffUserId', staffUserId);
    startRemove(async () => {
      const r = await removeStaffAction(fd);
      if ('error' in r) setRemoveError(r.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {invitePending && (
          <Button type="button" variant="outline" size="sm" className="max-sm:h-11" onClick={issue} disabled={issuing} aria-busy={issuing}>
            {issuing ? 'Creating…' : 'New invite link'}
          </Button>
        )}
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setRemoveError(null); }}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="max-sm:h-11">
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove {name}?</DialogTitle>
              <DialogDescription className="text-pretty">
                {name} is signed out straight away and can&apos;t sign in again. You can&apos;t undo this.
              </DialogDescription>
            </DialogHeader>
            {removeError && (
              <p role="alert" className="text-pretty text-sm text-danger">
                {removeError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={removing}>
                Keep {name.split(' ')[0]}
              </Button>
              <Button type="button" variant="destructive" onClick={remove} disabled={removing} aria-busy={removing}>
                {removing ? 'Removing…' : 'Remove from team'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {issueError && (
        <p role="alert" className="basis-full text-pretty text-caption text-danger">
          {issueError}
        </p>
      )}
      {invite && (
        <div className="basis-full">
          <InviteLinkPanel name={invite.name} inviteUrl={invite.inviteUrl} onDismiss={() => setInvite(null)} />
        </div>
      )}
    </>
  );
}
