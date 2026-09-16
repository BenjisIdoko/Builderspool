import { prisma } from '../prisma';
import { DispatchStatus } from '@prisma/client';

const DISPATCH_SEQUENCE: DispatchStatus[] = [
  DispatchStatus.ASSIGNED,
  DispatchStatus.AT_PICKUP,
  DispatchStatus.IN_TRANSIT,
  DispatchStatus.DELIVERED,
];

/** Null once a dispatch is at its final status (DELIVERED) or CANCELLED. */
export function nextDispatchStatus(current: DispatchStatus): DispatchStatus | null {
  const index = DISPATCH_SEQUENCE.indexOf(current);
  if (index === -1 || index === DISPATCH_SEQUENCE.length - 1) return null;
  return DISPATCH_SEQUENCE[index + 1];
}

/**
 * Advances a dispatch to its next real status. No live GPS/telemetry exists,
 * so `location` is what ops last physically confirmed — optional here since
 * an ops user may advance status without a location update in hand.
 */
export async function advanceDispatch(dispatchId: string, location?: string) {
  const dispatch = await prisma.dispatch.findUniqueOrThrow({ where: { id: dispatchId } });
  const next = nextDispatchStatus(dispatch.status);
  if (!next) throw new Error('This dispatch is already at its final status.');

  return prisma.dispatch.update({
    where: { id: dispatchId },
    data: {
      status: next,
      currentLocation: location?.trim() || dispatch.currentLocation,
      dispatchedAt: next === DispatchStatus.IN_TRANSIT && !dispatch.dispatchedAt ? new Date() : dispatch.dispatchedAt,
      deliveredAt: next === DispatchStatus.DELIVERED ? new Date() : dispatch.deliveredAt,
    },
  });
}

export async function cancelDispatch(dispatchId: string) {
  const dispatch = await prisma.dispatch.findUniqueOrThrow({ where: { id: dispatchId } });
  if (dispatch.status === DispatchStatus.DELIVERED) {
    throw new Error('A delivered dispatch cannot be cancelled.');
  }
  return prisma.dispatch.update({ where: { id: dispatchId }, data: { status: DispatchStatus.CANCELLED } });
}

export async function updateDispatchLocation(dispatchId: string, location: string) {
  if (!location.trim()) throw new Error('Enter a location.');
  return prisma.dispatch.update({ where: { id: dispatchId }, data: { currentLocation: location.trim() } });
}
