const RESEND_BASE_URL = 'https://api.resend.com';

// Sandbox sender — Resend delivers from this address to any real recipient
// without needing a verified custom domain. Swap RESEND_FROM_EMAIL once a
// real domain is verified; nothing else here needs to change.
const DEFAULT_FROM = 'Builders Pool <onboarding@resend.dev>';

function getApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set — email sending is not configured yet.');
  return key;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const res = await fetch(`${RESEND_BASE_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Failed to send email (${res.status}).`);
  }
}
