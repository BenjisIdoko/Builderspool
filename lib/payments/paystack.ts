import crypto from 'node:crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    console.error('PAYSTACK_SECRET_KEY is not set: payments are not configured.');
    throw new Error("Payments aren't available right now. Please try again shortly.");
  }
  return key;
}

interface InitializeParams {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  /** Which ways to pay Paystack's page offers. Omit to show every channel the account has on. */
  channels?: string[];
}

/** What the buyer picked at checkout, as Paystack channels. Without this Paystack opens its default card form. */
export function paystackChannelsFor(method: 'BANK_TRANSFER' | 'CARD' | 'USSD' | null | undefined): string[] | undefined {
  switch (method) {
    case 'CARD':
      return ['card'];
    case 'BANK_TRANSFER':
      return ['bank_transfer', 'bank'];
    case 'USSD':
      return ['ussd'];
    default:
      return undefined;
  }
}

interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializePaystackTransaction(params: InitializeParams): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100), // Paystack takes kobo, the smallest NGN unit
      reference: params.reference,
      callback_url: params.callbackUrl,
      ...(params.channels && params.channels.length > 0 ? { channels: params.channels } : {}),
    }),
  });

  const body = await res.json();
  if (!res.ok || !body.status) {
    throw new Error(body.message ?? 'Paystack transaction initialization failed.');
  }

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference: body.data.reference,
  };
}

interface VerifyResult {
  status: string; // 'success' | 'failed' | 'abandoned' | ...
  amountKobo: number;
  reference: string;
}

export async function verifyPaystackTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
    cache: 'no-store',
  });

  const body = await res.json();
  if (!res.ok || !body.status) {
    throw new Error(body.message ?? 'Paystack transaction verification failed.');
  }

  return {
    status: body.data.status,
    amountKobo: body.data.amount,
    reference: body.data.reference,
  };
}

// Paystack signs webhook bodies with HMAC-SHA512 of the raw request body,
// keyed by the secret key, sent back in the x-paystack-signature header.
export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto.createHmac('sha512', getSecretKey()).update(rawBody).digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const signatureBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
