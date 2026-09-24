import { AuthSplitScreen } from '@/components/auth-split-screen';
import { SellerSignInForm } from '@/components/seller-signin-form';

export const metadata = { title: 'Seller login' };

export default function SellerLoginPage() {
  return (
    <AuthSplitScreen
      eyebrow="Seller portal"
      headline="Bid on real, pooled demand."
      body="Blind, scored bidding across every buyer's pooled order — price, trust, capacity, and delivery speed all count."
    >
      <SellerSignInForm />
    </AuthSplitScreen>
  );
}
