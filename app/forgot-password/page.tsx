import { AuthSplitScreen } from '@/components/auth-split-screen';
import { ForgotPasswordForm } from '@/components/forgot-password-form';

export const metadata = { title: 'Forgot password' };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <AuthSplitScreen
      headline="Get back into your account."
      body="Reset links work once and expire in an hour."
    >
      <ForgotPasswordForm role={role ?? 'buyer'} />
    </AuthSplitScreen>
  );
}
