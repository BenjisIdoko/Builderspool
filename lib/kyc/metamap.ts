const METAMAP_OAUTH_URL = 'https://api.prod.metamap.com/oauth';
const METAMAP_API_BASE_URL = 'https://api.prod.metamap.com';

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.METAMAP_CLIENT_ID;
  const clientSecret = process.env.METAMAP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('METAMAP_CLIENT_ID/METAMAP_CLIENT_SECRET are not set — CAC verification is not configured yet.');
  }
  return { clientId, clientSecret };
}

// MetaMap issues a 1-hour JWT via OAuth client-credentials — cached in module
// scope so repeated verifications within the same server instance don't
// re-authenticate every time. Refetched 60s before actual expiry as a safety
// margin against clock drift; a cold serverless instance just fetches fresh.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret } = getClientCredentials();
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${METAMAP_OAUTH_URL}/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || typeof body.access_token !== 'string') {
    throw new Error(body.message ?? `MetaMap authentication failed (${res.status}).`);
  }

  const expiresInMs = (typeof body.expiresIn === 'number' ? body.expiresIn : 3600) * 1000;
  cachedToken = { accessToken: body.access_token, expiresAt: Date.now() + expiresInMs - 60_000 };
  return cachedToken.accessToken;
}

export interface CacVerificationResult {
  companyName: string;
  cacNumber: string;
  entityType: string; // BN, RC, or LLC
  status: string; // ACTIVE or INACTIVE, per the CAC registry itself
  companyAddress: string | null;
  registrationDate: string | null;
}

// Cross-checks a seller-entered CAC registration number against the real
// Corporate Affairs Commission registry via MetaMap's GovChecks API. Throws
// with the provider's own message on a real failure (not found, inactive,
// misconfigured credentials) — callers decide whether that's a user-facing
// "couldn't verify" message or a hard error.
export async function verifyCacNumber(registrationNumber: string): Promise<CacVerificationResult> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${METAMAP_API_BASE_URL}/govchecks/v1/ng/cac`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationNumber }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? `Could not verify CAC number ${registrationNumber}.`);
  }

  return {
    companyName: body.data.companyName,
    cacNumber: body.data.cacNumber,
    entityType: body.data.type,
    status: body.data.status,
    companyAddress: body.data.companyAddress ?? null,
    registrationDate: body.data.registrationDate ?? null,
  };
}
