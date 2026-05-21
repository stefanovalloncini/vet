import { onCall } from "firebase-functions/v2/https";

export { beforeSignIn } from "./auth/beforeSignIn.js";
export { onRoleChange } from "./auth/onRoleChange.js";
export { onAllowlistDelete } from "./auth/onAllowlistDelete.js";
export { revokeUserSession } from "./auth/revokeUserSession.js";
export { approveUser } from "./auth/approveUser.js";
export { rejectUser } from "./auth/rejectUser.js";
export { killSwitchOnBudget } from "./billing/killSwitch.js";
export { restoreAttivita } from "./attivita/restore.js";
export { purgeAttivita } from "./attivita/purge.js";
export { gdprDeleteMine } from "./gdpr/deleteMine.js";
export { dailyTrashCleanup } from "./trash/dailyCleanup.js";
export { monthlyInvoicePush } from "./invoicing/monthlyInvoice.js";

export const ping = onCall({ region: "europe-west8" }, () => {
  return { ok: true, version: "m8" };
});
