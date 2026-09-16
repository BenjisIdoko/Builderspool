import { LogoMark } from '@/components/logo';
import { AdminSignInForm } from '@/components/admin-signin-form';

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-lg border border-border bg-surface p-8">
        <div className="mb-8 flex items-center gap-2">
          <LogoMark className="size-8" />
          <span className="text-[15px] font-bold tracking-tight text-ink">Ops admin</span>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">Sign in with your ops account.</p>

        <AdminSignInForm />
      </div>
    </div>
  );
}
