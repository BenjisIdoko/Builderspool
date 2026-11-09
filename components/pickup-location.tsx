import { MapPinIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { directionsUrl, viewOnMapUrl } from '@/lib/maps';

// Where a buyer collects a pickup order: the fulfilment centre's name and address, with
// links to directions and a map. Used on checkout (once Pickup is chosen) and on the order page.
export function PickupLocation({ name, address }: { name: string; address: string }) {
  return (
    <section aria-labelledby="pickup-heading" className="rounded-card bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-info-soft text-brand">
          <MapPinIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="pickup-heading" className="text-heading-sm text-ink">
            Collect your order here
          </h2>
          <div className="mt-1 text-sm font-semibold text-ink">{name}</div>
          <div className="text-sm text-muted-foreground">{address}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={directionsUrl(address)} target="_blank" rel="noopener noreferrer">
                Get directions
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={viewOnMapUrl(address)} target="_blank" rel="noopener noreferrer">
                View on map
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
