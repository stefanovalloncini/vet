import { onCall } from "firebase-functions/v2/https";

export const ping = onCall({ region: "europe-west8" }, () => {
  return { ok: true, version: "m1" };
});
