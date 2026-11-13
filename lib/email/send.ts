import { sendEmail } from './resend';

// Plain, honest templates — no marketing chrome, no claims the app can't
// back. Both state the real expiry window in the copy itself rather than
// leaving it implicit, since a stale link that just silently 404s later is
// the kind of misleading UX this project avoids.
function shell(bodyHtml: string): string {
  return `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#15181c;">
      <div style="font-weight:800;font-size:16px;margin-bottom:24px;">Builders Pool</div>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#8a8f97;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Reset your Builders Pool password',
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 12px;">Reset your password</h1>
      <p style="font-size:14px;line-height:1.6;color:#5b6068;">
        Click the button below to choose a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2954e5;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;font-size:14px;">
        Reset password
      </a>
      <p style="margin-top:20px;font-size:12px;color:#8a8f97;word-break:break-all;">${resetUrl}</p>
    `),
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Verify your email — Builders Pool',
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 12px;">Verify your email</h1>
      <p style="font-size:14px;line-height:1.6;color:#5b6068;">
        Confirm this is your real email address. This link expires in 48 hours.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2954e5;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;font-size:14px;">
        Verify email
      </a>
      <p style="margin-top:20px;font-size:12px;color:#8a8f97;word-break:break-all;">${verifyUrl}</p>
    `),
  });
}

export async function sendBankChangeOtpEmail(to: string, code: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Your Builders Pool bank-detail code',
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 12px;">Confirm your bank-detail change</h1>
      <p style="font-size:14px;line-height:1.6;color:#5b6068;">
        Enter this code on the Builders Pool KYC page to confirm the change. It expires in 10 minutes. Never share it with anyone, including our staff.
      </p>
      <p style="margin:16px 0;font-size:32px;font-weight:800;letter-spacing:8px;">${code}</p>
      <p style="font-size:13px;line-height:1.6;color:#5b6068;">
        If you did not ask to change your bank details, do not enter the code. Your payouts are safe, and you should change your password.
      </p>
    `),
  });
}

export async function sendBankChangeDecisionEmail(to: string, approved: boolean, note?: string | null): Promise<void> {
  await sendEmail({
    to,
    subject: approved ? 'Your bank details were updated: Builders Pool' : 'Your bank-detail change was not approved: Builders Pool',
    html: shell(`
      <h1 style="font-size:20px;margin:0 0 12px;">${approved ? 'Bank details updated' : 'Bank-detail change not approved'}</h1>
      <p style="font-size:14px;line-height:1.6;color:#5b6068;">
        ${
          approved
            ? 'Our team approved your change. Payouts now go to the new account.'
            : `Our team could not approve your change${note ? `: ${note.replace(/</g, '&lt;')}` : '.'} Your payouts continue to the account already on file. You can submit a new request from the KYC page.`
        }
      </p>
    `),
  });
}
