import Link from 'next/link';
import { MagnifyingGlassIcon, UserCircleIcon, UsersIcon } from '@phosphor-icons/react/ssr';
import { Role } from '@prisma/client';
import { getUsersForAdmin, getUserRoleCounts } from '@/lib/queries/adminUsers';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ROLE_LABEL: Record<Role, string> = {
  BUYER: 'Buyer',
  SELLER: 'Seller',
  ADMIN: 'Admin',
};

const ROLE_TONE: Record<Role, 'info' | 'success' | 'neutral'> = {
  BUYER: 'info',
  SELLER: 'success',
  ADMIN: 'neutral',
};

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Pending',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

const ROLE_FILTERS = [
  { value: undefined, label: 'All', countKey: 'total' as const },
  { value: Role.BUYER, label: 'Buyers', countKey: 'buyers' as const },
  { value: Role.SELLER, label: 'Sellers', countKey: 'sellers' as const },
  { value: Role.ADMIN, label: 'Admins', countKey: 'admins' as const },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const { role, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const validRole = role && role in Role ? (role as Role) : undefined;

  const [{ users, total, pageCount }, counts] = await Promise.all([
    getUsersForAdmin({ role: validRole, query: q, page }),
    getUserRoleCounts(),
  ]);

  function urlFor(overrides: { role?: string; q?: string; page?: number }) {
    const params = new URLSearchParams();
    const r = overrides.role !== undefined ? overrides.role : role;
    const query = overrides.q !== undefined ? overrides.q : q;
    const p = overrides.page ?? 1;
    if (r) params.set('role', r);
    if (query) params.set('q', query);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Users</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every real account on the platform — buyers, sellers, and admins.
      </p>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ROLE_FILTERS.map((f) => (
          <div key={f.label} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-1 text-[11px] text-muted-foreground">{f.label}</div>
            <div className="text-xl font-semibold text-ink">{counts[f.countKey]}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((f) => {
            const active = validRole === f.value;
            return (
              <Link key={f.label} href={urlFor({ role: f.value ?? '', page: 1 })}>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
                  }`}
                >
                  {f.label} ({counts[f.countKey]})
                </span>
              </Link>
            );
          })}
        </div>

        <form className="flex max-w-xs flex-1 items-center gap-2">
          {validRole && <input type="hidden" name="role" value={validRole} />}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search name, email, or business…" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {q ? `No users match "${q}".` : 'No users in this category.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} className="size-8 shrink-0 text-[10px]" />
                      <div className="min-w-0">
                        <div className="max-w-44 truncate font-medium text-ink">{u.name}</div>
                        <div className="max-w-44 truncate text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={
                        ROLE_TONE[u.role] === 'info'
                          ? 'bg-info-soft text-info border-transparent'
                          : ROLE_TONE[u.role] === 'success'
                            ? 'bg-success-soft text-success border-transparent'
                            : 'border-border text-slate'
                      }
                    >
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    <div className="max-w-40 truncate">{u.businessName ?? '—'}</div>
                  </TableCell>
                  <TableCell className="py-3 text-ink">{u.location ?? '—'}</TableCell>
                  <TableCell className="py-3 text-ink">
                    {u.role === 'SELLER' && u.sellerProfile ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{u.sellerProfile.trustScore.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">trust score</span>
                      </div>
                    ) : u.role === 'BUYER' ? (
                      <span>
                        {u._count.orders} order{u._count.orders === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <UserCircleIcon className="size-4" />
                        Ops account
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {u.role === 'SELLER' && u.sellerProfile ? (
                      <Link href="/admin/verification" className="hover:underline">
                        <Badge variant="outline" className={pillClass(kycStatusTone(u.sellerProfile.kycStatus))}>
                          {KYC_LABEL[u.sellerProfile.kycStatus]}
                        </Badge>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground">
                    {u.createdAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing page {page} of {pageCount} · {total} matching
          </span>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page - 1 })}>Previous</Link>
              </Button>
            )}
            {page >= pageCount ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page + 1 })}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
