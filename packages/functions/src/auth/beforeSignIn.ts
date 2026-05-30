import { beforeUserSignedIn, HttpsError } from "firebase-functions/v2/identity";
import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import type { Capability } from "@vet/shared";
import { encodeCaps, normalizeEmail } from "@vet/shared";
import { adminDb } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { recordAccessRequest } from "./accessRequestLog.js";
import { recordAuthDenyAudit, type AuthDenyReason } from "./auditDenyLog.js";
import { decideTicketEnforcement } from "./ticketEnforcement.js";

interface ComposeInput {
  roleId: string;
  capabilities: Capability[];
  capsVer: number;
}

export function composeClaims(input: ComposeInput) {
  return {
    vet: true as const,
    roleId: input.roleId,
    caps: encodeCaps(input.capabilities),
    capsVer: input.capsVer,
  };
}

interface DecideInput {
  allow: { defaultRoleId: string };
  existing: {
    approved?: boolean;
    roleId?: string;
    displayName?: string;
    minCapsVer?: number;
  } | null;
  role: { capabilities: ReadonlyArray<Capability> };
  displayName: string;
}

interface DecideOutput {
  customClaims?: object;
  isFirst: boolean;
}

export function decideAuthResult(input: DecideInput): DecideOutput {
  const { allow, existing, role, displayName } = input;
  const isFirst = !existing;
  const approved = existing?.approved === true;

  if (!approved) {
    return { isFirst };
  }

  const roleId = existing?.roleId ?? allow.defaultRoleId;
  const claims = {
    ...composeClaims({
      roleId,
      capabilities: [...role.capabilities],
      capsVer: existing?.minCapsVer ?? 0,
    }),
    name: existing?.displayName ?? displayName,
  };

  return { customClaims: claims, isFirst };
}

function denyAndThrow(reason: AuthDenyReason, context: Record<string, unknown>): never {
  logger.warn("auth.beforeSignIn.deny", { reason, ...context });
  throw new HttpsError("permission-denied", "");
}

async function enforceSignInTicket(
  signInMethod: string | undefined,
  emailNorm: string
): Promise<boolean> {
  if (!decideTicketEnforcement({ signInMethod, ticket: null, nowMs: 0 }).requiresTicket) {
    return true;
  }

  const nowMs = Date.now();
  const snap = await adminDb
    .collection("signInTickets")
    .where("emailNorm", "==", emailNorm)
    .where("consumed", "==", true)
    .limit(10)
    .get();

  const valid = snap.docs.find(
    (d) =>
      decideTicketEnforcement({
        signInMethod,
        ticket: {
          consumed: true,
          expiresAtMs: (d.get("expiresAt") as Timestamp | undefined)?.toMillis(),
        },
        nowMs,
      }).allow
  );

  if (!valid) return false;

  await adminDb.runTransaction(async (tx) => {
    tx.delete(valid.ref);
  });
  return true;
}

const ALLOWED_PROVIDERS = new Set(["google.com", "password"]);

export const beforeSignIn: ReturnType<typeof beforeUserSignedIn> = beforeUserSignedIn(
  { region: "europe-west8" },
  async (event) => {
    const email = event.data?.email;
    const uid = event.data?.uid;
    const eventType = event.eventType;
    const provider = event.data?.providerData?.[0]?.providerId;
    const emailVerified = event.data?.emailVerified;

    if (!email) {
      await recordAuthDenyAudit({
        emailNorm: "unknown",
        email: "unknown",
        actorUid: uid,
        reason: "missing-email",
        source: "beforeSignIn",
        eventType,
      });
      denyAndThrow("missing-email", { uid, eventType });
    }

    const norm = normalizeEmail(email);

    if (provider && !ALLOWED_PROVIDERS.has(provider)) {
      await recordAuthDenyAudit({
        emailNorm: norm,
        email,
        actorUid: uid,
        reason: "provider-not-allowed",
        source: "beforeSignIn",
        eventType,
      });
      denyAndThrow("provider-not-allowed", { email: norm, uid, provider, eventType });
    }

    if (provider === "password" && emailVerified !== true) {
      await recordAuthDenyAudit({
        emailNorm: norm,
        email,
        actorUid: uid,
        reason: "email-not-verified",
        source: "beforeSignIn",
        eventType,
      });
      denyAndThrow("email-not-verified", { email: norm, uid, provider, eventType });
    }

    const repos = getRepositories();
    const allow = await repos.allowlist.getByEmail(email);
    if (!allow) {
      await recordAccessRequest({
        email,
        displayName: event.data?.displayName,
        photoURL: event.data?.photoURL,
        providerId: event.data?.providerData?.[0]?.providerId,
        source: "beforeSignIn",
      });
      await recordAuthDenyAudit({
        emailNorm: norm,
        email,
        actorUid: uid,
        reason: "allowlist-miss",
        source: "beforeSignIn",
        eventType,
      });
      denyAndThrow("allowlist-miss", { email: norm, uid, eventType });
    }

    const signInMethod = event.credential?.signInMethod;
    const ticketOk = await enforceSignInTicket(signInMethod, norm);
    if (!ticketOk) {
      await recordAuthDenyAudit({
        emailNorm: norm,
        email,
        actorUid: uid,
        reason: "ticket-invalid",
        source: "beforeSignIn",
        eventType,
      });
      denyAndThrow("ticket-invalid", { email: norm, uid, signInMethod, eventType });
    }

    const existingUser = uid ? await repos.users.getById(uid) : null;
    const roleId = existingUser?.roleId ?? allow.defaultRoleId;
    const role = await repos.roles.getById(roleId);
    if (!role) {
      await recordAuthDenyAudit({
        emailNorm: norm,
        email,
        actorUid: uid,
        reason: "role-missing",
        source: "beforeSignIn",
        eventType,
      });
      denyAndThrow("role-missing", { email: norm, uid, roleId, eventType });
    }

    const displayName =
      existingUser?.displayName
      ?? event.data?.displayName
      ?? email.split("@")[0]
      ?? email;
    const decision = decideAuthResult({
      allow,
      existing: existingUser
        ? {
            approved: existingUser.approved,
            roleId: existingUser.roleId,
            displayName: existingUser.displayName,
            ...(existingUser.minCapsVer !== undefined
              ? { minCapsVer: existingUser.minCapsVer }
              : {}),
          }
        : null,
      role: { capabilities: role.capabilities },
      displayName,
    });

    if (uid) {
      await repos.users.applySignInPatch(uid, {
        email,
        displayName,
        isFirst: decision.isFirst,
        defaultRoleId: allow.defaultRoleId,
      });
    }

    logger.info(
      decision.customClaims
        ? "auth.beforeSignIn.allow"
        : "auth.beforeSignIn.pending",
      {
        email: norm,
        uid,
        roleId,
        isFirst: decision.isFirst,
        eventType,
      }
    );

    return decision.customClaims ? { customClaims: decision.customClaims } : {};
  }
);
