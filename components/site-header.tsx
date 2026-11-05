import Link from 'next/link';
import { StorefrontIcon, UserIcon } from '@phosphor-icons/react/ssr';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { getCategories } from '@/lib/queries/materials';
import { CartSheet } from './cart-sheet';
import { HeaderSearch } from './header-search';
import { CategoryStrip } from './category-strip';
import { LogoMark, Wordmark } from './logo';

// Jumia-style storefront shell: utility strip (desktop), sticky white header
// with a pill search, then a scrollable category strip. On phones the search
// moves to its own row under the header and the utility strip hides.
export async function SiteHeader() {
  const [buyer, categories] = await Promise.all([getCurrentBuyer(), getCategories()]);

  return (
    <div className="sticky top-0 z-20 bg-surface shadow-[0_1px_0_var(--color-hairline)]">
      <div className="hidden bg-canvas lg:block">
        <div className="mx-auto flex h-10 max-w-section items-center justify-between text-[13px]">
          <Link
            href="/seller/signup"
            className="inline-flex min-h-8 items-center gap-1.5 font-medium text-orange-text hover:underline"
          >
            <StorefrontIcon className="size-4" />
            Sell on BuildersPool
          </Link>
          {buyer ? (
            <div className="flex items-center gap-5 text-slate">
              <Link href="/orders" className="hover:text-orange-text">
                Orders
              </Link>
              <Link href="/account" className="hover:text-orange-text">
                {buyer.name}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-5 text-slate">
              <Link href="/login" className="hover:text-orange-text">
                Log in
              </Link>
              <Link href="/signup" className="hover:text-orange-text">
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>

      <header className="mx-auto max-w-section">
        <div className="flex h-14 items-center gap-3 lg:h-16 lg:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="BuildersPool home">
            <LogoMark className="size-9 shrink-0 lg:size-12" />
            <Wordmark className="text-[20px] leading-none lg:text-[26px]" />
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <HeaderSearch />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0 lg:gap-3">
            <Link
              href={buyer ? '/account' : '/login'}
              className="hidden min-h-11 items-center gap-1.5 rounded-md px-2 text-[15px] font-medium text-text-storefront hover:text-orange-text md:inline-flex"
            >
              <UserIcon className="size-5" />
              {buyer ? 'Account' : 'Log in'}
            </Link>
            <CartSheet />
          </div>
        </div>
        <div className="pb-2.5 lg:hidden">
          <HeaderSearch />
        </div>
      </header>

      <CategoryStrip categories={categories.map((c) => c.name)} />
    </div>
  );
}
