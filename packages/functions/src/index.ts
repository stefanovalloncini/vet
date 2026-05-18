import { onCall } from "firebase-functions/v2/https";

export { beforeSignIn } from "./auth/beforeSignIn.js";

export const ping = onCall({ region: "europe-west8" }, () => {
  return { ok: true, version: "m2" };
});
