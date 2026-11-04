import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface AuditActor {
  id: string;
  role: string;
}

export interface AuditEntry {
  actor: AuditActor | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}

// Append-only. A failure to write the audit row is logged but never blocks the
// action it describes (a hiccup in the log must not strand a payout or award);
// the console error is the signal to investigate.
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actor?.id ?? null,
        actorRole: entry.actor?.role ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        metadata: entry.metadata,
      },
    });
  } catch (err) {
    console.error('Audit log write failed:', entry.action, err);
  }
}
