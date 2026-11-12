// The fulfilment-centre region an order belongs to, from the State of the
// locality the buyer picked. Only the FCT is served today; adding a state means
// adding its region here (and a fulfilment centre for it).
export function regionForState(stateName: string): string | null {
  return /^(fct|federal capital territory)$/i.test(stateName.trim()) ? 'ABUJA' : null;
}

/** The regions a pickup station can be in. A station's region decides which buyers it serves. */
export const STATION_REGIONS = ['ABUJA', 'LAGOS', 'KANO'] as const;
