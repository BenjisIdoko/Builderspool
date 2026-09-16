import { redirect } from 'next/navigation';
import { prisma } from '../prisma';
import { getBuyerIdFromSession } from './session';

// Real session-backed buyer lookup (2026-09-16), replacing the earlier
// single-hardcoded-account lib/demoBuyer.ts across every call site.
export async function getCurrentBuyer() {
  const buyerId = await getBuyerIdFromSession();
  if (!buyerId) return null;
  return prisma.user.findUnique({ where: { id: buyerId, role: 'BUYER' } });
}

// For pages/actions that require a signed-in buyer — redirects rather than
// letting a null buyer reach a query that assumes one exists.
export async function requireBuyer() {
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect('/login');
  return buyer;
}
