import { getDemoAdmin } from '@/lib/demoAdmin';
import { signInAdmin } from '../actions';
import { LogoMark } from '@/components/logo';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';

export default async function AdminLoginPage() {
  const admin = await getDemoAdmin();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-lg border border-border bg-surface p-8">
        <div className="mb-8 flex items-center gap-2">
          <LogoMark className="size-8" />
          <span className="text-[15px] font-bold tracking-tight text-ink">Ops admin</span>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-canvas p-4">
          <Avatar name={admin.name} className="size-10 text-sm" />
          <div>
            <div className="text-sm font-semibold text-ink">{admin.name}</div>
            <div className="text-xs text-muted-foreground">Seeded ops account</div>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          There&apos;s no admin auth yet — sign in as the single seeded ops account to continue.
        </p>

        <form action={signInAdmin}>
          <Button type="submit" size="lg" className="w-full">
            Continue as {admin.name}
          </Button>
        </form>
      </div>
    </div>
  );
}
