import { redirect } from 'next/navigation';
import { getSellerActor } from '@/lib/seller/session';
import { prisma } from '@/lib/prisma';
import { AddStaffForm } from '@/components/seller/add-staff-form';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';
import { ReissueInviteButton } from '@/components/seller/reissue-invite-button';
import { removeStaffAction } from './actions';

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
      <p className="mb-6 text-sm text-muted-foreground">
        Staff can view cycles, place bids and track orders for your business. Only you can change KYC details, bank
        details, terms and this team.
      </p>

      <div className="mb-6 overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-heading-sm text-ink">Staff ({staff.length})</h2>
        </div>
        {staff.length === 0 ? (
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="No staff yet"
            description="Add someone below to give them their own login."
          />
        ) : (
          <ul className="divide-y divide-border">
            {staff.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{m.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.user.email}</div>
                  <div className={`mt-1 text-caption ${m.user.passwordHash ? 'text-success' : 'text-warning-text'}`}>
                    {m.user.passwordHash ? 'Active' : 'Invite pending: no password set yet'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {!m.user.passwordHash && <ReissueInviteButton staffUserId={m.user.id} />}
                    <form action={removeStaffAction}>
                      <input type="hidden" name="staffUserId" value={m.user.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddStaffForm />
    </div>
  );
}
