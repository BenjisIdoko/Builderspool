import { requireBuyer } from '@/lib/buyer/auth';
import { AccountShell, ACCOUNT_CARD_PAD } from '@/components/account-shell';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBuyerProfile } from '../actions';

export const metadata = { title: 'Profile' };

export default async function AccountProfilePage() {
  const buyer = await requireBuyer();

  return (
    <AccountShell>
      <h1 className="mb-6 text-ink">Profile</h1>
      <section aria-labelledby="profile-heading" className={ACCOUNT_CARD_PAD}>
        <h2 id="profile-heading" className="mb-4 text-heading-sm text-ink">
          Your details
        </h2>
        <ActionForm action={updateBuyerProfile} successMessage="Saved." className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={buyer.email} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" defaultValue={buyer.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={buyer.phone ?? ''} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" autoComplete="organization" defaultValue={buyer.businessName ?? ''} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Job site or delivery location</Label>
            <Input id="location" name="location" autoComplete="street-address" defaultValue={buyer.location ?? ''} />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </ActionForm>
      </section>
    </AccountShell>
  );
}
