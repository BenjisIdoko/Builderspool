import Link from 'next/link';
import { CheckCircleIcon, CircleIcon, ClockIcon, InfoIcon, MinusCircleIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import type { Checklist, ChecklistStep, StepStatus } from '@/lib/onboarding/types';

// One card for every onboarding checklist. Each row says what it is, where it stands (in words,
// not only colour), who the next move belongs to, and links straight to the screen that fixes it.
const LOOK: Record<StepStatus, { Icon: typeof CircleIcon; weight: 'fill' | 'regular'; tone: string }> = {
  done: { Icon: CheckCircleIcon, weight: 'fill', tone: 'text-success' },
  todo: { Icon: CircleIcon, weight: 'regular', tone: 'text-brand' },
  waiting: { Icon: ClockIcon, weight: 'fill', tone: 'text-warning-text' },
  problem: { Icon: WarningIcon, weight: 'fill', tone: 'text-danger' },
  blocked: { Icon: MinusCircleIcon, weight: 'regular', tone: 'text-muted-foreground' },
  info: { Icon: InfoIcon, weight: 'fill', tone: 'text-slate' },
};

function statusLabel(step: ChecklistStep): string {
  switch (step.status) {
    case 'done':
      return 'Done';
    case 'todo':
      return 'To do';
    case 'waiting':
      return step.waitingOn === 'BuildersPool' ? 'Waiting on BuildersPool' : 'Waiting on you';
    case 'problem':
      return 'Needs attention';
    case 'blocked':
      return 'Next';
    default:
      return 'For your information';
  }
}

export function ChecklistCard({ title, intro, checklist }: { title: string; intro: string; checklist: Checklist }) {
  const pct = checklist.total === 0 ? 0 : Math.round((checklist.done / checklist.total) * 100);

  return (
    <section aria-labelledby="checklist-heading" className="mb-8 rounded-card bg-card-alt p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="checklist-heading" className="text-heading-md text-ink">
          {title}
        </h2>
        <span className="text-sm font-semibold text-ink tabular-nums">
          {checklist.done} of {checklist.total} done
        </span>
      </div>
      <p className="mt-1 max-w-[64ch] text-sm text-muted-foreground">{intro}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${title}: ${pct}% done`}>
        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>

      <ol className="mt-3 divide-y divide-hairline">
        {checklist.steps.map((step) => {
          const { Icon, weight, tone } = LOOK[step.status];
          return (
            <li key={step.id} className="flex flex-wrap items-start gap-x-3 gap-y-2 py-3.5">
              <Icon weight={weight} className={`mt-0.5 size-5 shrink-0 ${tone}`} aria-hidden />
              <div className="min-w-0 flex-1 basis-60">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-body font-semibold text-ink">{step.title}</span>
                  <span className={`text-caption font-semibold ${tone}`}>{statusLabel(step)}</span>
                </div>
                <p className="mt-0.5 max-w-[64ch] text-sm text-muted-foreground">{step.detail}</p>
              </div>
              {step.href && step.cta && (
                <Button asChild size="sm" variant={step.status === 'problem' || step.status === 'todo' ? 'default' : 'outline'} className="shrink-0">
                  <Link href={step.href}>{step.cta}</Link>
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
