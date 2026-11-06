import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CreateTeamMemberForm } from '@/components/admin/create-team-member-form';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pillClass } from '@/lib/statusColors';
import { setTeamMemberDisabledAction } from './actions';

export const metadata = { title: 'Team' };

const ROLE_LABEL: Partial<Record<Role, string>> = {
  QC_OFFICER: 'QC officer',
  FULFILMENT_OPERATOR: 'Fulfilment operator',
  DELIVERY_PARTNER: 'Delivery partner',
};

export default async function AdminTeamPage() {
  const members = await prisma.user.findMany({
    where: { role: { in: [Role.QC_OFFICER, Role.FULFILMENT_OPERATOR, Role.DELIVERY_PARTNER] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, disabledAt: true, createdAt: true },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-4xl">
      <div className="mb-1 text-xs text-muted-foreground">Admin · accounts</div>
      <h1 className="mb-1 text-heading-lg text-ink">Operations team</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Internal staff for catalogue QC, hub fulfilment and last-mile delivery. Their sign-in and workspaces arrive with
        those phases; accounts created now are ready for them. Seller staff are managed by each seller owner.
      </p>

      <div className="mb-6 overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-heading-sm text-ink">Team ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="No team members yet"
            description="Create a QC officer, fulfilment operator or delivery partner below."
          />
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{m.name}</span>
                    <Badge variant="outline" className={pillClass(m.disabledAt ? 'danger' : 'neutral')}>
                      {m.disabledAt ? 'Disabled' : (ROLE_LABEL[m.role] ?? m.role)}
                    </Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.disabledAt ? ` · ${ROLE_LABEL[m.role] ?? m.role}` : ''}
                  </div>
                </div>
                <form action={setTeamMemberDisabledAction}>
                  <input type="hidden" name="userId" value={m.id} />
                  <input type="hidden" name="disable" value={m.disabledAt ? 'false' : 'true'} />
                  <Button type="submit" variant="outline" size="sm">
                    {m.disabledAt ? 'Re-enable' : 'Disable'}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateTeamMemberForm />
    </div>
  );
}
