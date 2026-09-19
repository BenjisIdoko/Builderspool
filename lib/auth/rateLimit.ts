import { prisma } from '@/lib/prisma';

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

// Postgres-backed, not a new external service — reuses the database
// already in place rather than standing up Redis/Upstash for a single
// counter. Checked before the bcrypt compare in every sign-in action, so a
// locked-out identifier never even pays that cost.
export async function assertNotRateLimited(identifier: string): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const recentFailures = await prisma.loginAttempt.count({
    where: { identifier, succeeded: false, createdAt: { gte: since } },
  });
  if (recentFailures >= MAX_FAILURES) {
    throw new Error(`Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`);
  }
}

export async function recordLoginAttempt(identifier: string, succeeded: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { identifier, succeeded } });
}
