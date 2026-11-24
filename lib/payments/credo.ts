import crypto from 'node:crypto';

const CREDO_LIVE_URL = 'https://api.credocentral.com';
const CREDO_DEMO_URL = 'https://api.credodemo.com';

export function isCredoConfigured(): boolean {
  return Boolean(process.env.CREDO_PUBLIC_KEY && process.env.CREDO_SECRET_KEY);
}

export function isCredoTestMode(): boolean {
  const pub = process.env.CREDO_PUBLIC_KEY ?? '';
  const sec = process.env.CREDO_SECRET_KEY ?? '';
  return pub.startsWith('pk_demo') || sec.startsWith('sk_demo') || process.env.CREDO_ENV === 'demo';
}

function getBaseUrl(): string {
  if (process.env.CREDO_BASE_URL) {
    return process.env.CREDO_BASE_URL.replace(/\/$/, '');
  }
  return isCredoTestMode() ? CREDO_DEMO_URL : CREDO_LIVE_URL;
}

function getPublicKey(): string {
  const key = process.env.CREDO_PUBLIC_KEY;
  if (!key) {
    console.error('CREDO_PUBLIC_KEY is not set: Credo Pay is not configured.');
    throw new Error("Credo Pay isn't available right now. Please try Paystack or try again shortly.");
  }
  return key;
}

function getSecretKey(): string {
  const key = process.env.CREDO_SECRET_KEY;
  if (!key) {
    console.error('CREDO_SECRET_KEY is not set: Credo Pay verification is not configured.');
    throw new Error("Credo Pay isn't available right now. Please try Paystack or try again shortly.");
  }
  return key;
}

/** Maps checkout PaymentMethod to Credo Pay's channel names. */
export function credoChannelsFor(method: 'BANK_TRANSFER' | 'CARD' | 'USSD' | null | undefined): string[] | undefined {
  switch (method) {
    case 'CARD':
      return ['CARD'];
    case 'BANK_TRANSFER':
      return ['BANK'];
    case 'USSD':
      return ['USSD'];
    default:
      return undefined;
  }
}

interface CredoInitializeParams {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhoneNumber?: string;
  channels?: string[];
}

interface CredoInitializeResult {
  authorizationUrl: string;
  reference: string;
  credoReference: string;
}

/**
 * Initializes a Credo Pay checkout session.
 * Credo expects `Authorization: <PUBLIC_KEY>` (no Bearer prefix) and amount in kobo.
 */
export async function initializeCredoTransaction(params: CredoInitializeParams): Promise<CredoInitializeResult> {
  const res = await fetch(`${getBaseUrl()}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: getPublicKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(params.amountNaira * 100), // kobo
      email: params.email,
      currency: 'NGN',
      bearer: 0,
      reference: params.reference,
      callbackUrl: params.callbackUrl,
      ...(params.customerFirstName ? { customerFirstName: params.customerFirstName } : {}),
      ...(params.customerLastName ? { customerLastName: params.customerLastName } : {}),
      ...(params.customerPhoneNumber ? { customerPhoneNumber: params.customerPhoneNumber } : {}),
      ...(params.channels && params.channels.length > 0 ? { channels: params.channels } : {}),
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    status?: number;
    message?: string;
    data?: {
      authorizationUrl?: string;
      reference?: string;
      credoReference?: string;
    };
  };

  if (!res.ok || body.status !== 200 || !body.data?.authorizationUrl) {
    throw new Error(body.message ?? 'Credo Pay transaction initialization failed.');
  }

  return {
    authorizationUrl: body.data.authorizationUrl,
    reference: body.data.reference ?? params.reference,
    credoReference: body.data.credoReference ?? body.data.reference ?? params.reference,
  };
}

export interface CredoVerifyResult {
  paid: boolean;
  /** Amount in kobo (normalized whether Credo returns Naira decimals or integer kobo). */
  amountKobo: number;
  reference: string;
  transRef: string;
}

/**
 * Verifies a Credo Pay transaction server-side using the Secret Key.
 * In Credo's response, `data.status === 0` (or string 'success'/'successful') indicates success.
 */
export async function verifyCredoTransaction(transRef: string, expectedNaira: number): Promise<CredoVerifyResult> {
  const res = await fetch(`${getBaseUrl()}/transaction/${encodeURIComponent(transRef)}/verify`, {
    headers: {
      Authorization: getSecretKey(),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const body = (await res.json().catch(() => ({}))) as {
    status?: number;
    message?: string;
    data?: {
      status?: number | string;
      transAmount?: number;
      debitedAmount?: number;
      amount?: number;
      businessRef?: string;
      transRef?: string;
      reference?: string;
    };
  };

  if (!res.ok || body.status !== 200 || !body.data) {
    throw new Error(body.message ?? 'Credo Pay transaction verification failed.');
  }

  const d = body.data;
  const rawStatus = d.status;
  const paid =
    rawStatus === 0 ||
    rawStatus === '0' ||
    (typeof rawStatus === 'string' && ['success', 'successful', 'settled'].includes(rawStatus.toLowerCase()));

  // Credo's verify API returns transAmount in Naira (e.g. 15000.00) while some
  // endpoints return kobo (1500000). Normalize safely against expectedNaira.
  const rawAmount = Number(d.transAmount ?? d.amount ?? d.debitedAmount ?? 0);
  const expectedKobo = Math.round(expectedNaira * 100);
  const amountKobo =
    Math.abs(rawAmount - expectedNaira) < 0.01
      ? Math.round(rawAmount * 100)
      : Math.round(rawAmount);

  return {
    paid,
    amountKobo: amountKobo === expectedKobo ? expectedKobo : amountKobo,
    reference: d.businessRef ?? d.reference ?? transRef,
    transRef: d.transRef ?? transRef,
  };
}

/**
 * Verifies Credo Pay webhook HMAC-SHA512 signature (`x-credo-signature` or `credo-signature`).
 */
export function verifyCredoWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto.createHmac('sha512', getSecretKey()).update(rawBody).digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature.trim(), 'hex');
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}
