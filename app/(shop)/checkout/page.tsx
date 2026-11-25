import Link from 'next/link';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { CheckoutForm } from './checkout-form';
import { CheckoutSteps } from '@/components/checkout-steps';
import { getBuyerFacingTimes } from '@/lib/bidding/buyerTimes';
import { addDaysYmd, lagosYmd } from '@/lib/bidding/schedule';
import { isPoolClosedForToday } from '@/lib/pool-stages';
import { getCheckoutAreas } from '@/lib/queries/checkoutAreas';
import { getPickupCenters } from '@/lib/queries/pickupCenters';
import { getSavingsWalletForBuyer } from '@/lib/wallet';
import { isCredoConfigured, isCredoTestMode } from '@/lib/payments/credo';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { isMapsConfigured } from '@/lib/delivery/distance';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const buyer = await requireBuyer();
  const [{ times }, areas, centers, addressRows, stationRows, wallet, distanceSetting] = await Promise.all([
    getBuyerFacingTimes(),
    getCheckoutAreas(),
    getPickupCenters(),
    prisma.buyerAddress.findMany({ where: { buyerId: buyer.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }),
    prisma.buyerPickupStation.findMany({ where: { buyerId: buyer.id }, select: { centerId: true } }),
    getSavingsWalletForBuyer(buyer.id),
    getSetting<boolean>('delivery.distancePricingEnabled'),
  ]);

  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-10">
      <Link
        href="/cart"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-ink"
      >
        <CaretLeftIcon className="size-3.5" />
        Back to cart
      </Link>
      <CheckoutSteps current={1} />
      <h1 className="mb-2 text-ink">Checkout</h1>
      <p className="mb-8 text-body-sm text-muted-foreground">
        Ordering as {buyer.name} ({buyer.email}).
      </p>
      <CheckoutForm
        defaultContactName={buyer.businessName ?? buyer.name}
        defaultContactPhone={buyer.phone ?? ''}
        // True only when the configured Paystack key is a test key, so the
        // TEST tag can never appear on (or be missing from) a live payment.
        areas={areas}
        centers={centers}
        savedCenterId={buyer.pickupCenterId}
        savedCenterIds={stationRows.map((r) => r.centerId)}
        savedAddresses={addressRows.map((a) => ({ id: a.id, contactName: a.contactName, contactPhone: a.contactPhone, address: a.address, landmark: a.landmark, localityId: a.localityId, isDefault: a.isDefault }))}
        poolDay={isPoolClosedForToday(times) ? 'tomorrow' : 'today'}
        poolCloseTime={times.poolCloseTime}
        // Earliest on-site date a buyer can ask for: tomorrow, Lagos time.
        earliestDate={addDaysYmd(lagosYmd(new Date()), 1)}
        availableSavingsCredit={wallet.available}
        paystackConfigured={Boolean(process.env.PAYSTACK_SECRET_KEY)}
        credoConfigured={isCredoConfigured()}
        paystackTestMode={process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ?? false}
        credoTestMode={isCredoTestMode()}
        // Off until ops switch it on (Admin > Delivery pricing); also needs the maps key to be set.
        distancePricing={Boolean(distanceSetting) && isMapsConfigured()}
      />
    </div>
  );
}
