import { AuthSplitScreen } from '@/components/auth-split-screen';
import { AdminSignInForm } from '@/components/admin-signin-form';

export default function AdminLoginPage() {
  return (
    <AuthSplitScreen
      eyebrow="Ops admin"
      headline="Run the pool."
      body="Cycles, escrow, verification and haulage — the operations desk for every buyer and seller on Builders Pool."
    >
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Ops admin login</h2>
      <p className="mb-7 text-sm text-muted-foreground">Sign in with your ops account.</p>
      <AdminSignInForm />
    </AuthSplitScreen>
  );
}
