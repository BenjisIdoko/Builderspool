import { requireBuyer } from '@/lib/buyer/auth';
import { getPickupCenters } from '@/lib/queries/pickupCenters';
import { AccountShell, ACCOUNT_CARD_PAD } from '@/components/account-shell';
import { PickupStationPicker } from '@/components/pickup-station-picker';

export const metadata = { title: 'Pickup station' };

export default async function AccountPickupPage() {
  const [buyer, centers] = await Promise.all([requireBuyer(), getPickupCenters()]);

  return (
    <AccountShell>
      <h1 className="mb-2 text-ink">Pickup station</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Choose where you collect your orders. Checkout uses it whenever you pick Pickup, and you can still change it for a single order.
      </p>
      <section aria-label="Choose a pickup station" className={ACCOUNT_CARD_PAD}>
        <PickupStationPicker centers={centers} savedId={buyer.pickupCenterId} />
      </section>
    </AccountShell>
  );
}
