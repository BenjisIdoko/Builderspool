import { requireBuyer } from '@/lib/buyer/auth';
import { prisma } from '@/lib/prisma';
import { getPickupCenters } from '@/lib/queries/pickupCenters';
import { getCheckoutAreas } from '@/lib/queries/checkoutAreas';
import { AccountShell } from '@/components/account-shell';
import { AddressBook } from '@/components/account/address-book';

export const metadata = { title: 'Address book' };

export default async function AccountAddressesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [buyer, { tab }] = await Promise.all([requireBuyer(), searchParams]);
  const [centers, savedRows, addressRows, areas] = await Promise.all([
    getPickupCenters(),
    prisma.buyerPickupStation.findMany({ where: { buyerId: buyer.id }, orderBy: { createdAt: 'asc' } }),
    prisma.buyerAddress.findMany({
      where: { buyerId: buyer.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: { locality: { select: { name: true } } },
    }),
    getCheckoutAreas(),
  ]);

  const savedIds = new Set(savedRows.map((r) => r.centerId));
  const savedStations = centers.filter((c) => savedIds.has(c.id)).sort((a, b) => Number(b.id === buyer.pickupCenterId) - Number(a.id === buyer.pickupCenterId));
  const availableStations = centers.filter((c) => !savedIds.has(c.id));

  return (
    <AccountShell>
      <h1 className="mb-6 text-ink">Address book</h1>
      <div className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-hairline)]">
        <AddressBook
          initialTab={tab === 'delivery' ? 'delivery' : 'pickup'}
          savedStations={savedStations}
          availableStations={availableStations}
          defaultStationId={buyer.pickupCenterId}
          addresses={addressRows.map((a) => ({
            id: a.id,
            contactName: a.contactName,
            contactPhone: a.contactPhone,
            address: a.address,
            landmark: a.landmark,
            localityId: a.localityId,
            localityName: a.locality?.name ?? null,
            isDefault: a.isDefault,
          }))}
          areas={areas}
          defaultName={buyer.name}
          defaultPhone={buyer.phone ?? ''}
        />
      </div>
    </AccountShell>
  );
}
