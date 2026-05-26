import { onSchedule } from "firebase-functions/v2/scheduler";
import { getRepositories } from "../infrastructure/composition.js";

const TRASH_TTL_DAYS = 7;

export function computeTrashCutoff(now: Date, ttlDays = TRASH_TTL_DAYS): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - ttlDays);
  return cutoff;
}

export const dailyTrashCleanup = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    ingressSettings: "ALLOW_INTERNAL_ONLY",
  },
  async () => {
    const cutoff = computeTrashCutoff(new Date());
    const repos = getRepositories();
    const purged = await repos.attivita.purgeOlderThanDeletedAt(cutoff);
    if (purged > 0) {
      await repos.audit.record({
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "attivita.purge.auto",
        targetType: "attivita",
        targetId: "batch",
        details: { count: purged, cutoff: cutoff.toISOString() },
      });
    }
  }
);
