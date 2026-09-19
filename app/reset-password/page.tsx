import { AuthSplitScreen } from '@/components/auth-split-screen';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; role?: string }>;
}) {
  const { token, role } = await searchParams;

  return (
    <AuthSplitScreen
      eyebrow="Construction materials · sourced nationally"
      headline="Choose a new password."
      body="Once reset, you'll sign back in with your new password."
    >
      {token ? (
        <ResetPasswordForm token={token} role={role ?? 'buyer'} />
      ) : (
        <p className="text-sm text-danger">This reset link is missing its token.</p>
      )}
    </AuthSplitScreen>
  );
}
