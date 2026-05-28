import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "vet-dev";
if (!getApps().length) initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

const AZIENDA_ID = "demo-azienda-1";
const TIPO_ID = "visita-clinica";
const ATTIVITA_ID = "demo-attivita-1";
const CONTO_ID = "demo-conto-2";
const VET_UID = "audit-admin-uid";
const VET_NAME = "Audit Admin";
const VET_EMAIL = "audit.admin@example.com";

await db.collection("aziende").doc(AZIENDA_ID).set({
  nome: "Allevamento Demo",
  nomeNorm: "allevamento demo",
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  createdBy: VET_UID,
  updatedBy: VET_UID,
  createdByName: VET_NAME,
  updatedByName: VET_NAME,
  isDeleted: false,
  schemaVersion: 1,
});

const periodoFrom = new Date("2026-05-01T00:00:00Z");
const periodoTo = new Date("2026-05-31T23:59:59Z");
const attivitaData = new Date("2026-05-15T10:00:00Z");

await db.collection("attivita").doc(ATTIVITA_ID).set({
  data: Timestamp.fromDate(attivitaData),
  aziendaId: AZIENDA_ID,
  aziendaNome: "Allevamento Demo",
  tipoId: TIPO_ID,
  tipoNome: "Visita clinica",
  oraria: false,
  adElemento: false,
  tariffa: 80,
  totale: 80,
  ownerUid: VET_UID,
  ownerEmail: VET_EMAIL,
  ownerName: VET_NAME,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  isDeleted: false,
  schemaVersion: 1,
});

await db.collection("conti").doc(CONTO_ID).set({
  aziendaId: AZIENDA_ID,
  aziendaNome: "Allevamento Demo",
  periodoFrom: Timestamp.fromDate(periodoFrom),
  periodoTo: Timestamp.fromDate(periodoTo),
  modalita: "emesso",
  saldato: false,
  attivitaIds: [ATTIVITA_ID],
  totaleConto: 80,
  emittedAt: FieldValue.serverTimestamp(),
  emittedBy: VET_UID,
  emittedByName: VET_NAME,
  isDeleted: false,
  schemaVersion: 1,
});

console.log("seeded demo azienda + attivita + conto in vet-dev");
