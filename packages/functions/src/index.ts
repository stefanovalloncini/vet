import { onCall } from "firebase-functions/v2/https";

export { beforeSignIn } from "./auth/beforeSignIn.js";
export { onRoleChange } from "./auth/onRoleChange.js";
export { revokeUserSession } from "./auth/revokeUserSession.js";
export { killSwitchOnBudget } from "./billing/killSwitch.js";

export const ping = onCall({ region: "europe-west8" }, () => {
  return { ok: true, version: "m2" };
});
