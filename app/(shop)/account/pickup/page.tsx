import { redirect } from 'next/navigation';

// Pickup stations now live in the address book.
export default function AccountPickupRedirect() {
  redirect('/account/addresses');
}
