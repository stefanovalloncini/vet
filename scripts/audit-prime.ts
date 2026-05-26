import { writeFileSync } from "node:fs";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const FAKE_API_KEY = "fake-emulator-api-key";
const PROJECT_ID = "vet-dev";
const AUTH_HOST = "127.0.0.1:9099";

if (!getApps().length) initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const ADMIN = {
  uid: "audit-admin-uid",
  email: "audit.admin@example.com",
  password: "Audit-Admin-1!",
  displayName: "Audit Admin",
  roleId: "admin",
};

const ADMIN_CAPS = [
  "activities.read.all","activities.create","activities.update.own","activities.update.any",
  "activities.delete.own","activities.delete.any","activities.export",
  "aziende.read","aziende.create","aziende.update","aziende.delete",
  "activity_types.read","activity_types.manage",
  "trash.read.own","trash.read.any","trash.restore.own","trash.restore.any","trash.purge",
  "roles.read","roles.manage","roles.assign",
  "allowlist.read","allowlist.manage",
  "audit.read","users.read.all","users.approve",
  "conti.proforma","conti.emit","conti.saldo",
  "reminders.read","reminders.create","reminders.update.own","reminders.update.any","reminders.delete.own","reminders.delete.any",
];

function encodeCaps(caps: ReadonlyArray<string>): string[] { return [...caps]; }

try { await auth.deleteUser(ADMIN.uid); } catch { /* ignore */ }
await auth.createUser({ uid: ADMIN.uid, email: ADMIN.email, password: ADMIN.password, displayName: ADMIN.displayName, emailVerified: true });
await auth.setCustomUserClaims(ADMIN.uid, { vet: true, roleId: ADMIN.roleId, caps: encodeCaps(ADMIN_CAPS), capsVer: 1, name: ADMIN.displayName });

// allowlist
const norm = ADMIN.email.toLowerCase();
await db.collection("allowlist").doc(norm).set({
  email: ADMIN.email, defaultRoleId: ADMIN.roleId, invitedBy: "audit-prime",
  invitedAt: FieldValue.serverTimestamp(), schemaVersion: 1,
});

// roles (admin role)
await db.collection("roles").doc("admin").set({
  name: "Amministratore", capabilities: ADMIN_CAPS, locked: true,
  createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  createdBy: "audit-prime", updatedBy: "audit-prime", schemaVersion: 1,
});

// users doc
await db.collection("users").doc(ADMIN.uid).set({
  email: ADMIN.email, displayName: ADMIN.displayName, disabled: false, approved: true,
  roleId: ADMIN.roleId, createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(), lastSignInAt: FieldValue.serverTimestamp(),
  schemaVersion: 1,
});

// sign in via REST to get tokens
const signInRes = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FAKE_API_KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password, returnSecureToken: true }),
});
if (!signInRes.ok) throw new Error(`sign-in failed: ${await signInRes.text()}`);
const signIn = await signInRes.json() as { idToken: string; refreshToken: string; localId: string; expiresIn: string };

const stored = {
  uid: ADMIN.uid, email: ADMIN.email, emailVerified: true, displayName: ADMIN.displayName,
  isAnonymous: false,
  providerData: [{ providerId: "password", uid: ADMIN.email, displayName: ADMIN.displayName, email: ADMIN.email, phoneNumber: null, photoURL: null }],
  stsTokenManager: { refreshToken: signIn.refreshToken, accessToken: signIn.idToken, expirationTime: Date.now() + Number(signIn.expiresIn) * 1000 },
  createdAt: String(Date.now()), lastLoginAt: String(Date.now()),
  apiKey: FAKE_API_KEY, appName: "[DEFAULT]",
};
writeFileSync("/tmp/vet-audit-auth.json", JSON.stringify({ key: `firebase:authUser:${FAKE_API_KEY}:[DEFAULT]`, value: JSON.stringify(stored) }, null, 2));
console.log("primed", ADMIN.email);
