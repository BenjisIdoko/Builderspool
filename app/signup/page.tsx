import { AuthSplitScreen } from '@/components/auth-split-screen';
import { BuyerSignUpForm } from '@/components/buyer-signup-form';

export default function SignUpPage() {
  return (
    <AuthSplitScreen
      eyebrow="Construction materials · sourced nationally"
      headline="Buy materials at a fair, fixed price."
      body="Cement, blocks, rebar, roofing and fittings — pooled daily with other buyers for a better price than you'd get alone."
    >
      <BuyerSignUpForm />
    </AuthSplitScreen>
  );
}
