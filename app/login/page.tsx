import { AuthSplitScreen } from '@/components/auth-split-screen';
import { BuyerSignInForm } from '@/components/buyer-signin-form';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <AuthSplitScreen
      headline="One fixed price, no back-and-forth."
      body="Track orders, reorder in one click and manage price alerts."
    >
      <BuyerSignInForm />
    </AuthSplitScreen>
  );
}
