// Daily cutoff window calculation. Hardcoded for MVP, easy to change.
export const CUTOFF_HOUR = 18; // 6pm

export function getCycleWindowForDate(date: Date, cutoffHour = CUTOFF_HOUR) {
  const cycleDate = new Date(date);
  cycleDate.setUTCHours(0, 0, 0, 0);

  const cutoffAt = new Date(cycleDate);
  cutoffAt.setUTCHours(cutoffHour, 0, 0, 0);

  return { date: cycleDate, cutoffAt };
}

export function isPastCutoff(cutoffAt: Date, now = new Date()) {
  return now.getTime() >= cutoffAt.getTime();
}
