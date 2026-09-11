import { getDemoBuyer } from '@/lib/demoBuyer';
import { CheckoutForm } from './checkout-form';

export default async function CheckoutPage() {
  const buyer = await getDemoBuyer();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-medium tracking-tight text-ink">Checkout</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ordering as {buyer.name} ({buyer.email}) — buyer accounts aren&apos;t built yet, so every
        checkout uses this demo account for now.
      </p>
      <CheckoutForm buyerId={buyer.id} />
    </div>
  );
}
