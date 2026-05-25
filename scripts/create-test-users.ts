import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { runScript } from "./lib/runScript.js";

const BASE_EMAIL = process.env["VET_TEST_BASE_EMAIL"] ?? "stefano.valloncini@gmail.com";

interface TestUser {
  suffix: string;
  roleId: string;
  displayName: string;
}

const TEST_USERS: ReadonlyArray<TestUser> = [
  {
    suffix: "capo",
    roleId: "veterinario_capo",
    displayName: "Test Veterinario Capo",
  },
  {
    suffix: "semplice",
    roleId: "veterinario_semplice",
    displayName: "Test Veterinario Semplice",
  },
];

function plusAddress(base: string, suffix: string): string {
  const [local, domain] = base.split("@");
  if (!local || !domain) throw new Error(`Invalid base email: ${base}`);
  return `${local}+${suffix}@${domain}`;
}

function norm(email: string): string {
  return email.trim().toLowerCase();
}

await runScript({
  scriptName: "create-test-users",
  run: async () => {
    const db = getFirestore();
    const auth = getAuth();
    const continueUrl =
      process.env["VET_TEST_CONTINUE_URL"] ??
      "https://gestionale.stefanovalloncini.com/login/complete";

    process.stdout.write(`Base email: ${BASE_EMAIL}\n`);
    process.stdout.write(`Continue URL: ${continueUrl}\n\n`);

    for (const u of TEST_USERS) {
      const email = plusAddress(BASE_EMAIL, u.suffix);
      const emailNorm = norm(email);

      await db.collection("allowlist").doc(emailNorm).set(
        {
          email,
          defaultRoleId: u.roleId,
          invitedBy: "create-test-users",
          invitedAt: FieldValue.serverTimestamp(),
          notes: `Test account for role ${u.roleId}`,
          schemaVersion: 1,
        },
        { merge: true }
      );
      process.stdout.write(`allowlist/${emailNorm} -> ${u.roleId}\n`);

      try {
        await auth.getUserByEmail(email);
        process.stdout.write(`auth: user already exists for ${email}\n`);
      } catch {
        await auth.createUser({
          email,
          displayName: u.displayName,
          emailVerified: false,
        });
        process.stdout.write(`auth: created ${email}\n`);
      }

      const link = await auth.generateSignInWithEmailLink(email, {
        url: continueUrl,
        handleCodeInApp: true,
      });

      process.stdout.write(`\n  ROLE:  ${u.roleId}\n`);
      process.stdout.write(`  EMAIL: ${email}\n`);
      process.stdout.write(`  LINK:  ${link}\n\n`);
    }

    process.stdout.write(
      "Done. Open each link in a separate browser profile / incognito window.\n" +
        "When prompted, re-enter the email (Firebase same-device check).\n"
    );
  },
});
