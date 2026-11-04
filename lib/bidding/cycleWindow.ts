export function isPastCutoff(cutoffAt: Date, now = new Date()) {
  return now.getTime() >= cutoffAt.getTime();
}
