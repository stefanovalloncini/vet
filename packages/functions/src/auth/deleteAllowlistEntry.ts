import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { getRepositories } from "../infrastructure/composition.js";
import { decodeCaps, normalizeEmail } from "@vet/shared";

const inputSchema = z
  .object({ email: z.string().min(3).max(120) })
  .strict();

interface Caller {
  uid: string;
  email: string;
  caps: string[];
}

export function ensureCanManageAllowlist(caller: Caller | null): asserts caller is Caller {
  if (!caller) throw new HttpsError("unauthenticated", "");
  if (!caller.caps.includes("allowlist.manage")) {
    throw new HttpsError("permission-denied", "");
  }
}

export const deleteAllowlistEntry = onCall(
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

    ensureCanManageAllowlist(caller);

    let email: string;
    try {
      ({ email } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const emailNorm = normalizeEmail(email);
    const repos = getRepositories();

    await repos.audit.record({
      actorUid: caller.uid,
      actorEmail: caller.email,
      action: "allowlist.delete",
      targetType: "allowlist",
      targetId: emailNorm,
      details: { email },
    });

    await repos.allowlist.remove(email);

    return { ok: true as const };
  }
);
