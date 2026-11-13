import { PhoneIcon, ShieldCheckIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { approveBankChangeAction, completeBankCallAction, rejectBankChangeAction, setBankCallRequiredAction } from '@/app/admin/(dashboard)/verification/bank-actions';
import { ActionForm } from '@/components/ui/action-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatLagosDateTime } from '@/lib/format';
import { pillClass } from '@/lib/statusColors';
import type { BankChangeRow } from '@/lib/queries/adminBank';

const MATCH = {
  MATCH: { label: 'Name matches', tone: 'success' },
  PARTIAL: { label: 'Name partly matches', tone: 'warning' },
  MISMATCH: { label: 'Name does not match', tone: 'danger' },
} as const;

function Detail({ label, oldValue, newValue }: { label: string; oldValue: string | null; newValue: string }) {
  const changed = (oldValue ?? '') !== newValue;
  return (
    <div className="grid grid-cols-[7rem_1fr_1fr] gap-x-3 border-b border-hairline py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-muted-foreground">{oldValue ?? '—'}</dd>
      <dd className={`min-w-0 break-words font-medium ${changed ? 'text-ink' : 'text-muted-foreground'}`}>{newValue}</dd>
    </div>
  );
}

// One bank-detail change waiting for ops. Approving needs the seller's emailed code (already
// confirmed to be here) and, when ops asked for one, a logged confirmation call.
export function BankChangeReviewCard({ request }: { request: BankChangeRow }) {
  const seller = request.seller.businessName ?? request.seller.name;
  const match = request.nameMatch ? MATCH[request.nameMatch as keyof typeof MATCH] : null;
  const callBlocking = request.callRequired && !request.callCompletedAt;

  return (
    <li className="rounded-card bg-card-alt p-5 shadow-[0_0_0_1px_var(--color-hairline)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-heading-sm text-ink">{seller}</h3>
          <p className="text-caption tabular-nums text-muted-foreground">
            Asked {formatLagosDateTime(request.createdAt)} · {request.seller.email}
          </p>
        </div>
        {match && (
          <Badge variant="outline" className={pillClass(match.tone)}>
            {match.label}
          </Badge>
        )}
      </div>

      <dl className="mt-4">
        <div className="grid grid-cols-[7rem_1fr_1fr] gap-x-3 pb-1 text-caption font-semibold text-slate">
          <span />
          <span>On file now</span>
          <span>Requested</span>
        </div>
        <Detail label="Bank" oldValue={request.oldBankName} newValue={request.newBankName} />
        <Detail label="Account number" oldValue={request.oldAccountNumber} newValue={request.newAccountNumber} />
        <Detail label="Account name" oldValue={request.oldAccountName} newValue={request.newAccountName} />
      </dl>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
        <ShieldCheckIcon aria-hidden className="size-4 shrink-0" />
        <span className="tabular-nums">Emailed code confirmed {request.otpVerifiedAt ? formatLagosDateTime(request.otpVerifiedAt) : ''}</span>
      </p>

      <div className="mt-4 rounded-md bg-surface p-4">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <PhoneIcon aria-hidden className="size-4" />
          Confirmation call
        </h4>
        {request.callCompletedAt ? (
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            <span className="tabular-nums">Done {formatLagosDateTime(request.callCompletedAt)}.</span> {request.callNote}
          </p>
        ) : request.callRequired ? (
          <div className="mt-1 space-y-3">
            <p className="flex items-start gap-1.5 text-pretty text-sm text-warning-text">
              <WarningIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Call the owner on <strong className="tabular-nums">{request.seller.phone ?? 'a number you can verify (none on file)'}</strong> and confirm the change, then log it. Approval is blocked until you do.
              </span>
            </p>
            <ActionForm action={completeBankCallAction} className="space-y-2">
              <input type="hidden" name="id" value={request.id} />
              <Label htmlFor={`call-${request.id}`}>What the owner confirmed</Label>
              <Textarea id={`call-${request.id}`} name="note" rows={2} required maxLength={500} placeholder="Spoke to the owner. They confirmed the new account and the reason." />
              <Button type="submit" size="sm">
                Log the call
              </Button>
            </ActionForm>
            <ActionForm action={setBankCallRequiredAction}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="required" value="false" />
              <Button type="submit" variant="ghost" size="sm" className="-ml-2">
                A call isn&apos;t needed after all
              </Button>
            </ActionForm>
          </div>
        ) : (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-pretty text-sm text-muted-foreground">Optional. Ask for one if anything looks off, such as a name that does not match.</p>
            <ActionForm action={setBankCallRequiredAction}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="required" value="true" />
              <Button type="submit" variant="outline" size="sm">
                Require a call
              </Button>
            </ActionForm>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <ActionForm
          action={approveBankChangeAction}
          confirm={{
            title: `Approve the new bank details for ${seller}?`,
            description: `Payouts will go to ${request.newBankName}, account ending ${request.newAccountNumber.slice(-4)}. The seller is emailed. This is recorded in the audit log.`,
            confirmLabel: 'Approve change',
          }}
        >
          <input type="hidden" name="id" value={request.id} />
          <Button type="submit" disabled={callBlocking}>
            Approve change
          </Button>
        </ActionForm>
        <ActionForm
          action={rejectBankChangeAction}
          className="flex min-w-0 flex-1 flex-wrap items-start gap-2"
          confirm={{ title: `Reject this change for ${seller}?`, description: 'Their payouts stay with the account already on file. The seller is emailed your reason.', confirmLabel: 'Reject change', destructive: true }}
        >
          <input type="hidden" name="id" value={request.id} />
          <div className="min-w-48 flex-1">
            <Label htmlFor={`reject-${request.id}`} className="sr-only">
              Reason for rejecting
            </Label>
            <Input id={`reject-${request.id}`} name="reason" required minLength={5} maxLength={300} placeholder="Reason for rejecting (the seller sees it)" />
          </div>
          <Button type="submit" variant="outline">
            Reject
          </Button>
        </ActionForm>
      </div>
    </li>
  );
}
