// One shape for every onboarding checklist (sellers, ops), so one card renders them all.
// `waiting` always says who the next move belongs to; `info` rows are context and are not
// counted toward progress.
export type StepStatus = 'done' | 'todo' | 'waiting' | 'problem' | 'blocked' | 'info';

export interface ChecklistStep {
  id: string;
  title: string;
  status: StepStatus;
  detail: string;
  href?: string;
  cta?: string;
  /** Who the next move belongs to when status is "waiting". */
  waitingOn?: 'you' | 'BuildersPool';
}

export interface Checklist {
  steps: ChecklistStep[];
  done: number;
  total: number;
  complete: boolean;
}

export function summarise(steps: ChecklistStep[], completeWhen: (s: ChecklistStep[]) => boolean): Checklist {
  const counted = steps.filter((s) => s.status !== 'info');
  const done = counted.filter((s) => s.status === 'done').length;
  return { steps, done, total: counted.length, complete: completeWhen(steps) };
}
