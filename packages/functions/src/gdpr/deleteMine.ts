import { onCall, HttpsError } from "firebase-functions/v2/https";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";

const ANON_UID = "deleted-user";
const ANON_NAME = "—";

export const gdprDeleteMine = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "");
    const uid = auth.uid;
    const email = (auth.token.email as string) ?? "";

    const repos = getRepositories();
    const attivita = await repos.attivita.deleteAllForOwner(uid);
    const aziendeAnon = await repos.aziende.anonymizeOwnerReferences(uid, {
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
    if (email) {
      const allow = await repos.allowlist.getByEmail(email);
      if (allow) {
        await repos.allowlist.remove(email);
        allowlistDoc = true;
      }
    }

    const erased = {
      attivita,
      aziendeAnon,
      remindersAnon,
      userDoc,
      allowlistDoc,
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
