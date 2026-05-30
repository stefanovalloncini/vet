import { onCall, HttpsError } from "firebase-functions/v2/https";
import { normalizeEmail } from "@vet/shared";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { ensureRecentAuth } from "../auth/recentAuth.js";
import { readActorClaims } from "../auth/actorClaims.js";

const ANON_UID = "deleted-user";
const ANON_NAME = "—";

export const gdprDeleteMine = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "");
    ensureRecentAuth(request);
    const uid = auth.uid;
    const email = readActorClaims(auth.token).email;

    const repos = getRepositories();
    const attivita = await repos.attivita.deleteAllForOwner(uid);
    const attivitaEditorAnon = await repos.attivita.anonymizeOwnerReferences(
      uid,
      { anonUid: ANON_UID, anonName: ANON_NAME }
    );
    const aziendeAnon = await repos.aziende.anonymizeOwnerReferences(uid, {
      anonUid: ANON_UID,
      anonName: ANON_NAME,
    });
    const contiAnon = await repos.conti.anonymizeOwnerReferences(uid, {
      anonUid: ANON_UID,
      anonName: ANON_NAME,
    });
    const remindersAnon = await repos.reminders.anonymizeCreatedBy(
      uid,
      ANON_UID
    );

    let userDoc = false;
    if ((await repos.users.getById(uid)) !== null) {
      await repos.users.hardDelete(uid);
      userDoc = true;
    }

    let allowlistDoc = false;
    let accessRequestDoc = false;
    if (email) {
      const allow = await repos.allowlist.getByEmail(email);
      if (allow) {
        await repos.allowlist.remove(email);
        allowlistDoc = true;
      }
      const emailNorm = normalizeEmail(email);
      const accessReq = await repos.accessRequests.getByEmail(emailNorm);
      if (accessReq) {
        await repos.accessRequests.delete(emailNorm);
        accessRequestDoc = true;
      }
    }

    const auditAnon = await repos.audit.anonymizeActorReferences(uid, {
      anonUid: ANON_UID,
      anonEmail: "",
    });

    const erased = {
      attivita,
      attivitaEditorAnon,
      aziendeAnon,
      contiAnon,
      remindersAnon,
      auditAnon,
      userDoc,
      allowlistDoc,
      accessRequestDoc,
    };

    await repos.audit.record({
      actorUid: ANON_UID,
      actorEmail: "",
      action: "gdpr.erasure",
      targetType: "user",
      targetId: ANON_UID,
      details: { ...erased, originalUidHash: "redacted" },
    });

    try {
      await adminAuth.revokeRefreshTokens(uid);
      await adminAuth.deleteUser(uid);
    } catch {
      // user might have been already removed; continue
    }

    return { ok: true, erased };
  }
);
