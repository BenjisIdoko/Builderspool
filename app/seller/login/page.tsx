import { getSellerAccounts } from '@/lib/queries/sellerPortal';
import { selectSeller } from '../actions';
import { Button } from '@/components/ui/button';

export default async function SellerLoginPage() {
  const sellers = await getSellerAccounts();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-semibold text-brand-ink">
          B
        </span>
        <span className="text-[15px] font-medium tracking-tight text-ink">Seller portal</span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Seller accounts don&apos;t have real sign-in yet — pick a seeded account to continue.
      </p>

      <div className="flex flex-col gap-2">
        {sellers.map((seller) => (
          <form key={seller.userId} action={selectSeller}>
            <input type="hidden" name="userId" value={seller.userId} />
            <Button
              type="submit"
              variant="outline"
              className="h-auto w-full justify-between px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-medium text-ink">{seller.user.businessName ?? seller.user.name}</span>
                <span className="block text-xs text-muted-foreground">{seller.regionsServed.join(', ')}</span>
              </span>
              <span className="text-xs text-slate">Trust {seller.trustScore}</span>
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
