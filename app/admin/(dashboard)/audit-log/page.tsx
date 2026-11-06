import Link from 'next/link';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration, NoResultsIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const metadata = { title: 'Audit log' };

const PAGE_SIZE = 25;

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  const { type, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const where = {
    entityType: type || undefined,
    ...(q
      ? {
          OR: [
            { summary: { contains: q, mode: 'insensitive' as const } },
            { action: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [entries, total, types] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ['entityType'], select: { entityType: true }, orderBy: { entityType: 'asc' } }),
  ]);
  const actorIds = [...new Set(entries.map((e) => e.actorId).filter((id): id is string => !!id))];
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } });
  const actorById = new Map(actors.map((a) => [a.id, a]));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function urlFor(o: { type?: string; page?: number }) {
    const params = new URLSearchParams();
    const t = o.type !== undefined ? o.type : type;
    if (t) params.set('type', t);
    if (q) params.set('q', q);
    if (o.page && o.page > 1) params.set('page', String(o.page));
    const qs = params.toString();
    return `/admin/audit-log${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · system</div>
      <h1 className="mb-1 text-heading-lg text-ink">Audit log</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Who changed what — approvals, awards, payouts, settings and catalogue edits. Entries are never edited or deleted.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {[{ value: '', label: 'All' }, ...types.map((t) => ({ value: t.entityType, label: t.entityType }))].map((f) => (
            <Link key={f.label} href={urlFor({ type: f.value })}>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  (type ?? '') === f.value ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
                }`}
              >
                {f.label}
              </span>
            </Link>
          ))}
        </div>
        <form className="flex max-w-xs flex-1 items-center gap-2">
          {type && <input type="hidden" name="type" value={type} />}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search actions…" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg bg-card-alt">
          <EmptyState
            illustration={q || type ? NoResultsIllustration : EmptyListIllustration}
            variant="inline"
            as="p"
            title={q || type ? 'No entries match' : 'Nothing recorded yet'}
            description={q || type ? undefined : 'Admin actions will appear here as they happen.'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-card-alt">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>What</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const actor = e.actorId ? actorById.get(e.actorId) : null;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="py-3 whitespace-nowrap text-muted-foreground">
                      {e.createdAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })}
                    </TableCell>
                    <TableCell className="py-3 text-ink">{actor ? actor.name : (e.actorRole ?? 'System')}</TableCell>
                    <TableCell className="py-3 font-mono text-xs text-slate">{e.action}</TableCell>
                    <TableCell className="py-3 text-ink">{e.summary}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pageCount} · {total} entries
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page - 1 })}>Previous</Link>
              </Button>
            )}
            {page < pageCount && (
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
