import { AuthSplitScreen } from '@/components/auth-split-screen';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <AuthSplitScreen
      eyebrow="Construction materials · sourced nationally"
      headline="Get back into your account."
      body="A reset link only works once and expires in an hour — request a new one anytime."
    >
      <ForgotPasswordForm role={role ?? 'buyer'} />
    </AuthSplitScreen>
  );
}
