'use client';

import { useRef, useState, useTransition } from 'react';
import { CheckCircleIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { submitKyc, verifyCacAction } from '@/app/seller/(dashboard)/kyc/actions';
import { KycDocumentInput } from '@/components/seller/kyc-document-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type KycFormValues = {
  businessRegNumber: string;
  cacNumber: string;
  idType: string;
  idNumber: string;
  tin: string;
  businessAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  documentExpiresAt: string;
};

export type CacCheck = { verifiedName: string | null; entityType: string | null; status: string | null; error: string | null };

const ID_TYPES = ['NIN', 'International passport', "Driver's licence"];

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-pretty text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}

const SECTION = 'space-y-4 py-5 first:pt-0 last:pb-0';
const LEGEND = 'text-heading-sm text-ink';

// The seller's verification details. Problems come back as text beside the
// button, and typed answers stay put: neither a failed submit nor a CAC check
// resets the form.
export function KycForm({
  values,
  cac,
  documentOnFile,
  uploadEnabled,
  termsVersion,
  todayYmd,
  resubmitting,
}: {
  values: KycFormValues;
  cac: CacCheck;
  documentOnFile: string | null;
  uploadEnabled: boolean;
  termsVersion: string;
  todayYmd: string;
  resubmitting: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, startSubmit] = useTransition();
  const [checking, startCheck] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startSubmit(async () => {
      const r = await submitKyc(fd);
      if ('error' in r) setError(r.error);
    });
  }

  function verifyCac() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startCheck(async () => {
      await verifyCacAction(fd);
    });
  }

  const busy = submitting || checking;

  return (
    <form ref={formRef} onSubmit={submit} className="divide-y divide-border rounded-lg bg-card-alt p-5 sm:p-6">
      <div role="group" aria-labelledby="kyc-business" className={SECTION}>
        <h2 id="kyc-business" className={LEGEND}>
          Business
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="businessRegNumber" label="Business registration number">
            <Input id="businessRegNumber" name="businessRegNumber" required autoComplete="off" defaultValue={values.businessRegNumber} />
          </Field>
          <Field id="tin" label="Tax identification number (TIN)">
            <Input id="tin" name="tin" required autoComplete="off" defaultValue={values.tin} />
          </Field>
        </div>
        <Field id="businessAddress" label="Business address">
          <Input id="businessAddress" name="businessAddress" required autoComplete="street-address" defaultValue={values.businessAddress} />
        </Field>

        <div className="space-y-3 rounded-md bg-well/50 p-4">
          <Field id="cacNumber" label="CAC number" hint="We check this number against the Corporate Affairs Commission registry.">
            <Input id="cacNumber" name="cacNumber" required autoComplete="off" className="bg-surface" defaultValue={values.cacNumber} />
          </Field>
          {cac.verifiedName && (
            <p role="status" className="flex items-start gap-1.5 text-pretty text-sm text-success">
              <CheckCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Verified: {cac.verifiedName}
                {(cac.entityType || cac.status) && ` (${[cac.entityType, cac.status].filter(Boolean).join(', ')})`}
              </span>
            </p>
          )}
          {cac.error && (
            <p role="alert" className="flex items-start gap-1.5 text-pretty text-sm text-danger">
              <WarningIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{cac.error}</span>
            </p>
          )}
          <Button type="button" variant="outline" onClick={verifyCac} disabled={busy} aria-busy={checking}>
            {checking ? 'Checking…' : 'Verify CAC number'}
          </Button>
        </div>
      </div>

      <div role="group" aria-labelledby="kyc-identity" className={SECTION}>
        <h2 id="kyc-identity" className={LEGEND}>
          Identity
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="idType" label="ID type">
            <Select name="idType" required defaultValue={values.idType || undefined}>
              <SelectTrigger id="idType" className="h-11 w-full">
                <SelectValue placeholder="Select an ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="idNumber" label="ID number">
            <Input id="idNumber" name="idNumber" required autoComplete="off" defaultValue={values.idNumber} />
          </Field>
        </div>
      </div>

      <div role="group" aria-labelledby="kyc-bank" className={SECTION}>
        <h2 id="kyc-bank" className={LEGEND}>
          Bank account for payouts
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="bankName" label="Bank">
            <Input id="bankName" name="bankName" required autoComplete="off" defaultValue={values.bankName} />
          </Field>
          <Field id="bankAccountNumber" label="Account number" hint="10 digits.">
            <Input id="bankAccountNumber" name="bankAccountNumber" required inputMode="numeric" pattern="\d{10}" autoComplete="off" defaultValue={values.bankAccountNumber} />
          </Field>
          <Field id="bankAccountName" label="Account name">
            <Input id="bankAccountName" name="bankAccountName" required autoComplete="off" defaultValue={values.bankAccountName} />
          </Field>
        </div>
        <p className="max-w-[64ch] text-pretty text-caption text-muted-foreground">
          The account name should match your registered business name. Only the owner can change bank details.
        </p>
      </div>

      <div role="group" aria-labelledby="kyc-document" className={SECTION}>
        <h2 id="kyc-document" className={LEGEND}>
          Supporting document
        </h2>
        {uploadEnabled ? (
          <Field id="document" label="Document" hint="PDF, JPEG or PNG, up to 4 MB. A CAC certificate or your ID works.">
            <KycDocumentInput />
          </Field>
        ) : (
          <p className="max-w-[64ch] text-pretty text-sm text-muted-foreground">
            Document upload isn&apos;t available yet. You can submit without one and our team will follow up.
          </p>
        )}
        {documentOnFile && (
          <p className="text-pretty text-caption text-muted-foreground">
            On file: {documentOnFile}. {uploadEnabled && 'Choose a new file only to replace it.'}
          </p>
        )}
        <Field id="documentExpiresAt" label="Document expiry date" hint="Only if the document has one, for example a SON certificate.">
          <DatePicker id="documentExpiresAt" name="documentExpiresAt" min={todayYmd} defaultValue={values.documentExpiresAt} placeholder="No expiry date" />
        </Field>
      </div>

      <div className="space-y-4 pt-5">
        <label className="flex items-start gap-3 text-sm text-ink">
          <Checkbox name="termsAccepted" required className="mt-0.5" />
          <span>
            I accept the BuildersPool seller terms (version {termsVersion}) on behalf of this business.
            <span className="block text-caption text-muted-foreground">The full terms text will be published before the pilot.</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          {error && (
            <p role="alert" className="min-w-0 flex-1 basis-56 text-pretty text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} aria-busy={submitting}>
            {submitting ? 'Submitting…' : resubmitting ? 'Resubmit for review' : 'Submit for review'}
          </Button>
        </div>
      </div>
    </form>
  );
}
