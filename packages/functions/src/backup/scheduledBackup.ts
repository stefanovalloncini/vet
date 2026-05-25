import { onSchedule } from "firebase-functions/v2/scheduler";
import { getAuditRepository } from "../infrastructure/composition.js";

interface TokenResponse {
  access_token: string;
}

async function getMetadataAccessToken(): Promise<string> {
  const res = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!res.ok) {
    throw new Error(`metadata token fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

export const scheduledFirestoreBackup = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
  },
  async () => {
    const project = process.env.GCLOUD_PROJECT ?? "vet-marinoni";
    const today = new Date().toISOString().slice(0, 10);
    const prefix = `gs://${project}-backups/auto-${today}`;
    const token = await getMetadataAccessToken();
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default):exportDocuments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outputUriPrefix: prefix }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`firestore export failed: ${res.status} ${text}`);
    }
    await getAuditRepository().record({
      actorUid: "system",
      actorEmail: "scheduled@vet",
      action: "backup.firestore.export",
      targetType: "firestore",
      targetId: "all",
      details: { outputUriPrefix: prefix },
    });
  }
);
