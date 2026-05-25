import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { getRepositories } from "../infrastructure/composition.js";
import { decodeCaps } from "@vet/shared";

const inputSchema = z.object({ id: z.string().min(1).max(64) }).strict();

interface Caller {
  uid: string;
  email: string;
  caps: string[];
}

export function ensureCanRestore(
  caller: Caller | null,
  ownerUid: string
): void {
  if (!caller) throw new HttpsError("unauthenticated", "");
  const ownsIt = caller.uid === ownerUid;
  if (ownsIt && caller.caps.includes("trash.restore.own")) return;
  if (caller.caps.includes("trash.restore.any")) return;
  throw new HttpsError("permission-denied", "");
}

export const restoreAttivita = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "");
    const caller: Caller = {
      uid: auth.uid,
      email: (auth.token.email as string) ?? "",
      caps: decodeCaps((auth.token.caps as string[]) ?? []),
    };

    let id: string;
    try {
      ({ id } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const repos = getRepositories();
    const attivita = await repos.attivita.getById(id);
    if (!attivita) throw new HttpsError("not-found", "");
    if (!attivita.isDeleted) {
      throw new HttpsError("failed-precondition", "");
    }
    ensureCanRestore(caller, attivita.ownerUid);

    await repos.attivita.restore(id);

    await repos.audit.record({
      actorUid: caller.uid,
      actorEmail: caller.email,
      action: "attivita.restore",
      targetType: "attivita",
      targetId: id,
    });

    return { ok: true };
  }
);
