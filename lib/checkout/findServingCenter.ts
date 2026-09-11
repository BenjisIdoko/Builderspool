import { prisma } from '../prisma';

/** Routes an order to a fulfillment center serving its region. */
export function findServingCenter(region: string) {
  return prisma.fulfillmentCenter.findFirst({ where: { region } });
}
