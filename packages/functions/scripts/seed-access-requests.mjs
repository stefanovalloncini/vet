import admin from "firebase-admin";

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

admin.initializeApp({ projectId: "vet-dev" });
const db = admin.firestore();

const now = admin.firestore.Timestamp.now();

await db.collection("accessRequests").doc("mario.rossi@example.com").set({
  emailNorm: "mario.rossi@example.com",
  email: "Mario.Rossi@example.com",
  displayName: "Mario Rossi",
  providerId: "google.com",
  firstAttemptAt: admin.firestore.Timestamp.fromDate(new Date("2026-05-21T08:30:00Z")),
  lastAttemptAt: now,
  attempts: 3,
  schemaVersion: 1,
});

await db.collection("accessRequests").doc("hacker@example.com").set({
  emailNorm: "hacker@example.com",
  email: "hacker@example.com",
  providerId: "password",
  firstAttemptAt: admin.firestore.Timestamp.fromDate(new Date("2026-05-15T10:00:00Z")),
  lastAttemptAt: admin.firestore.Timestamp.fromDate(new Date("2026-05-21T12:50:00Z")),
  attempts: 12,
  schemaVersion: 1,
});

console.log("seeded 2 access requests");
process.exit(0);
