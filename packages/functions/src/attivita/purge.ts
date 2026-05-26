import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { getRepositories } from "../infrastructure/composition.js";
import { decodeCaps } from "@vet/shared";
import { ensureRecentAuth } from "../auth/recentAuth.js";

const inputSchema = z.object({ id: z.string().min(1).max(64) }).strict();

interface Caller {
  uid: string;
  email: string;
  caps: string[];
}

export function ensureCanPurge(caller: Caller | null): void {
  if (!caller) throw new HttpsError("unauthenticated", "");
  if (!caller.caps.includes("trash.purge")) {
    throw new HttpsError("permission-denied", "");
  }
}

export const purgeAttivita = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    const caller: Caller | null = auth
      ? {
          uid: auth.uid,
          email: (auth.token.email as string) ?? "",
          caps: decodeCaps((auth.token.caps as string[]) ?? []),
        }
      : null;

    ensureCanPurge(caller);
    ensureRecentAuth(request);

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

    await repos.run(async (tx) => {
      await tx.attivita.hardDelete(id);
      await tx.audit.record({
        actorUid: caller!.uid,
        actorEmail: caller!.email,
        action: "attivita.purge",
        targetType: "attivita",
        targetId: id,
        details: { ownerUid: attivita.ownerUid },
      });
    });

    return { ok: true };
  }
);
