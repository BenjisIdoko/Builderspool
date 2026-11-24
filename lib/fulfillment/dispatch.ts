import { prisma } from '../prisma';
import { DispatchStatus } from '@prisma/client';
import { notifyBuyerDispatchUpdate } from '../notifications';

const DISPATCH_SEQUENCE: DispatchStatus[] = [
  DispatchStatus.ASSIGNED,
  DispatchStatus.AT_PICKUP,
  DispatchStatus.IN_TRANSIT,
  DispatchStatus.DELIVERED,
];

const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
  ASSIGNED: 'Assigned',
  AT_PICKUP: 'At pickup',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

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
  const dispatch = await prisma.dispatch.findUniqueOrThrow({
    where: { id: dispatchId },
    include: {
      orderItem: {
        include: {
          order: { select: { id: true, buyerId: true } },
          material: { select: { name: true } },
        },
      },
    },
  });
  const next = nextDispatchStatus(dispatch.status);
  if (!next) throw new Error('This dispatch is already at its final status.');

  const updated = await prisma.dispatch.update({
    where: { id: dispatchId },
    data: {
      status: next,
      currentLocation: location?.trim() || dispatch.currentLocation,
      dispatchedAt: next === DispatchStatus.IN_TRANSIT && !dispatch.dispatchedAt ? new Date() : dispatch.dispatchedAt,
      deliveredAt: next === DispatchStatus.DELIVERED ? new Date() : dispatch.deliveredAt,
    },
  });

  await notifyBuyerDispatchUpdate(
    dispatch.orderItem.order.buyerId,
    dispatch.orderItem.order.id,
    dispatch.orderItem.material.name,
    DISPATCH_STATUS_LABEL[next],
    updated.currentLocation,
  );

  return updated;
}

export async function cancelDispatch(dispatchId: string) {
  const dispatch = await prisma.dispatch.findUniqueOrThrow({
    where: { id: dispatchId },
    include: {
      orderItem: {
        include: {
          order: { select: { id: true, buyerId: true } },
          material: { select: { name: true } },
        },
      },
    },
  });
  if (dispatch.status === DispatchStatus.DELIVERED) {
    throw new Error('A delivered dispatch cannot be cancelled.');
  }
  const updated = await prisma.dispatch.update({ where: { id: dispatchId }, data: { status: DispatchStatus.CANCELLED } });

  await notifyBuyerDispatchUpdate(
    dispatch.orderItem.order.buyerId,
    dispatch.orderItem.order.id,
    dispatch.orderItem.material.name,
    DISPATCH_STATUS_LABEL.CANCELLED,
    updated.currentLocation,
  );

  return updated;
}

export async function updateDispatchLocation(dispatchId: string, location: string) {
  if (!location.trim()) throw new Error('Enter a location.');
  return prisma.dispatch.update({ where: { id: dispatchId }, data: { currentLocation: location.trim() } });
}
