import { AuthSplitScreen } from '@/components/auth-split-screen';
import { BuyerSignInForm } from '@/components/buyer-signin-form';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <AuthSplitScreen
      eyebrow="Construction materials · sourced nationally"
      headline="One fixed price, no back-and-forth."
      body="Sign in to track your orders, reorder in one click, and manage price alerts on the materials you buy."
    >
      <BuyerSignInForm />
    </AuthSplitScreen>
  );
}
