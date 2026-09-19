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
