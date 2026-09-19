import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react/ssr';
import { verifyEmailToken } from '@/lib/auth/emailVerification';
import { AuthSplitScreen } from '@/components/auth-split-screen';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailToken(token) : { error: 'This verification link is missing its token.' };

  return (
    <AuthSplitScreen
      eyebrow="Construction materials · sourced nationally"
      headline="Verify your email."
      body="Confirming your email helps keep your account secure."
    >
      {'success' in result ? (
        <>
          <CheckCircleIcon className="mb-3 size-8 text-success" />
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Email verified</h2>
          <p className="mb-7 text-sm text-muted-foreground">Thanks — your email address is confirmed.</p>
        </>
      ) : (
        <>
          <XCircleIcon className="mb-3 size-8 text-danger" />
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Couldn&apos;t verify</h2>
          <p className="mb-7 text-sm text-danger">{result.error}</p>
        </>
      )}
      <Link href="/" className="text-sm font-medium text-brand hover:underline">
        Back to Builders Pool
      </Link>
    </AuthSplitScreen>
  );
}
