import { redirect } from 'next/navigation';
import { getSellerActor } from '@/lib/seller/session';
import { prisma } from '@/lib/prisma';
import { AddStaffForm } from '@/components/seller/add-staff-form';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { Badge } from '@/components/ui/badge';
import { StaffActions } from '@/components/seller/staff-actions';

export const metadata = { title: 'Team' };

export default async function SellerTeamPage() {
  const actor = await getSellerActor();
  if (!actor) redirect('/seller/login');
  if (!actor.isOwner) redirect('/seller');

  const staff = await prisma.sellerStaff.findMany({
    where: { sellerUserId: actor.sellerId },
    include: { user: { select: { id: true, name: true, email: true, passwordHash: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-3xl">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · team</div>
      <h1 className="mb-1 text-heading-lg text-ink">Team</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Staff get their own login to bid, manage listings and track orders for your business. Only you can change
        verification details, bank details, terms and this team.
      </p>

      <div className="mb-6 overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-heading-sm text-ink">
            Staff (<span className="tabular-nums">{staff.length}</span>)
          </h2>
        </div>
        {staff.length === 0 ? (
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="No staff yet"
            description="Add a staff member below to give them their own login."
          />
        ) : (
          <ul className="divide-y divide-border">
            {staff.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium text-ink">{m.user.name}</span>
                    {m.user.passwordHash ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Invite not used yet</Badge>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
                </div>
                <StaffActions staffUserId={m.user.id} name={m.user.name} invitePending={!m.user.passwordHash} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddStaffForm />
    </div>
  );
}
