import { AuthSplitScreen } from '@/components/auth-split-screen';
import { SellerSignUpForm } from '@/components/seller-signup-form';

export default function SellerSignUpPage() {
  return (
    <AuthSplitScreen
      eyebrow="Seller portal"
      headline="Supply real construction demand."
      body="Register your business, complete KYC, and start bidding on daily demand pools across Nigeria."
    >
      <SellerSignUpForm />
    </AuthSplitScreen>
  );
}
