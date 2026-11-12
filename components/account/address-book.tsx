'use client';

import { useState } from 'react';
import { DeliveryAddresses, type SavedAddress } from '@/components/account/delivery-addresses';
import { SavedStations } from '@/components/account/saved-stations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CheckoutAreas } from '@/lib/queries/checkoutAreas';
import type { PickupCenter } from '@/lib/queries/pickupCenters';

// The address book: one tab for pickup stations, one for delivery addresses.
export function AddressBook({
  initialTab,
  savedStations,
  availableStations,
  defaultStationId,
  addresses,
  areas,
  defaultName,
  defaultPhone,
}: {
  initialTab: 'pickup' | 'delivery';
  savedStations: PickupCenter[];
  availableStations: PickupCenter[];
  defaultStationId: string | null;
  addresses: SavedAddress[];
  areas: CheckoutAreas;
  defaultName: string;
  defaultPhone: string;
}) {
  const [tab, setTab] = useState(initialTab);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'pickup' | 'delivery')} className="gap-5">
      <TabsList variant="line" className="h-11 w-full justify-start gap-2 border-b border-hairline">
        <TabsTrigger value="pickup" className="h-11 flex-none px-4 text-[15px] uppercase">
          Pickup station
        </TabsTrigger>
        <TabsTrigger value="delivery" className="h-11 flex-none px-4 text-[15px] uppercase">
          Door delivery
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pickup" className="text-base">
        <SavedStations saved={savedStations} available={availableStations} defaultId={defaultStationId} />
      </TabsContent>
      <TabsContent value="delivery" className="text-base">
        <DeliveryAddresses addresses={addresses} areas={areas} defaultName={defaultName} defaultPhone={defaultPhone} />
      </TabsContent>
    </Tabs>
  );
}
