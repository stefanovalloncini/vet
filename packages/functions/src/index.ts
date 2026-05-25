import { onCall } from "firebase-functions/v2/https";

export { beforeSignIn } from "./auth/beforeSignIn.js";
export { beforeUserCreated } from "./auth/beforeUserCreated.js";
export { onRoleChange } from "./auth/onRoleChange.js";
export { onAllowlistDelete } from "./auth/onAllowlistDelete.js";
export { revokeUserSession } from "./auth/revokeUserSession.js";
export { selfRevoke } from "./auth/selfRevoke.js";
export { deleteAllowlistEntry } from "./auth/deleteAllowlistEntry.js";
export { createSignInTicket, consumeSignInTicket } from "./auth/signInTicket.js";
export { logAppCheckFailure } from "./diag/logAppCheckFailure.js";
export { approveUser } from "./auth/approveUser.js";
export { rejectUser } from "./auth/rejectUser.js";
export { acceptAccessRequest } from "./auth/acceptAccessRequest.js";
export { rejectAccessRequest } from "./auth/rejectAccessRequest.js";
export { killSwitchOnBudget } from "./billing/killSwitch.js";
export { restoreAttivita } from "./attivita/restore.js";
export { purgeAttivita } from "./attivita/purge.js";
export { gdprDeleteMine } from "./gdpr/deleteMine.js";
export { dailyTrashCleanup } from "./trash/dailyCleanup.js";
export { monthlyInvoicePush } from "./invoicing/monthlyInvoice.js";
export { dailyDriveExport } from "./backup/dailyDriveExport.js";
export { cleanupOldDriveBackups } from "./backup/cleanupOldDriveBackups.js";
export { weeklyBackupDigest } from "./backup/weeklyBackupDigest.js";

export const ping = onCall({ region: "europe-west8" }, () => {
  return { ok: true, version: "m8" };
});
