import "server-only";
import { ServiceError } from "./qloo.ts";

type Operation = "search" | "plan";
type Limit = { concurrent: number; hourly: number };
const defaults: Record<Operation, Limit> = { search: { concurrent: 4, hourly: 300 }, plan: { concurrent: 2, hourly: 60 } };

// Per-process protection only: numeric counters, no IPs, cookies, IDs or request content.
// Restarts/multiple instances reset or multiply these limits; this is not a spending cap.
export function createAdmission(limits = defaults, now = Date.now) {
  const buckets: Record<Operation, { active: number; count: number; hour: number }> = {
    search: { active: 0, count: 0, hour: -1 }, plan: { active: 0, count: 0, hour: -1 },
  };
  return function acquire(operation: Operation) {
    const bucket = buckets[operation], limit = limits[operation];
    const hour = Math.floor(now() / 3_600_000);
    if (bucket.hour !== hour) { bucket.hour = hour; bucket.count = 0; }
    if (bucket.active >= limit.concurrent) throw new ServiceError("preview_busy", "This preview is busy. Please try again in a moment; your accepted activities stay in place.", 429);
    if (bucket.count >= limit.hourly) throw new ServiceError("preview_limit", "This preview has reached its hourly discovery allowance. Please try again next hour; your accepted activities stay in place.", 429);
    bucket.active++; bucket.count++;
    let released = false;
    return () => { if (!released) { released = true; bucket.active--; } };
  };
}

export const acquireAdmission = createAdmission();
