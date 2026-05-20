import { onSchedule } from "firebase-functions/v2/scheduler";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { isCadenzaDue, periodFor, type Cadenza } from "./period.js";

interface Azienda {
  id: string;
  nome: string;
  cadenzaFatturazione?: Cadenza;
  emailFatturazione?: string;
}

interface Attivita {
  data: Timestamp;
  aziendaNome: string;
  tipoNome: string;
  tariffa: number;
  ore?: number;
  totale: number;
  oraria?: boolean;
  note?: string;
}

export const monthlyInvoicePush = onSchedule(
  {
    schedule: "0 9 10 * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
  },
  async () => {
    const runAt = new Date();
    const aziendeSnap = await adminDb
      .collection("aziende")
      .where("isDeleted", "==", false)
      .get();

    for (const doc of aziendeSnap.docs) {
      const data = doc.data() as Partial<Azienda>;
      const cadenza = data.cadenzaFatturazione;
      const email = data.emailFatturazione;
      if (!cadenza || !email) continue;
      if (!isCadenzaDue(cadenza, runAt)) continue;

      const period = periodFor(cadenza, runAt);
      const attivitaSnap = await adminDb
        .collection("attivita")
        .where("isDeleted", "==", false)
        .where("aziendaId", "==", doc.id)
        .where("data", ">=", Timestamp.fromDate(period.start))
        .where("data", "<=", Timestamp.fromDate(period.end))
        .get();
      const items = attivitaSnap.docs.map(
        (d) => d.data() as Attivita
      );
      if (items.length === 0) continue;

      const total = items.reduce((s, a) => s + a.totale, 0);
      const html = renderHtmlReport({
        aziendaNome: data.nome ?? "",
        periodLabel: period.label,
        items,
        total,
      });

      await adminDb.collection("mail").add({
        to: email,
        message: {
          subject: `Riepilogo attività ${period.label} — ${data.nome ?? ""}`,
          html,
        },
        createdAt: FieldValue.serverTimestamp(),
        aziendaId: doc.id,
        period: period.label,
      });

      await adminDb.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "invoicing.monthly.push",
        targetType: "azienda",
        targetId: doc.id,
        details: {
          period: period.label,
          count: items.length,
          total: Math.round(total * 100) / 100,
        },
      });
    }
  }
);

interface RenderInput {
  aziendaNome: string;
  periodLabel: string;
  items: Attivita[];
  total: number;
}

export function renderHtmlReport(input: RenderInput): string {
  const rows = input.items
    .map(
      (a) =>
        `<tr><td>${escapeHtml(formatDate(a.data))}</td><td>${escapeHtml(a.tipoNome)}</td><td style="text-align:right">${formatEuro(a.totale)}</td></tr>`
    )
    .join("");
  return `<!doctype html><html lang="it"><body style="font-family:Georgia,serif;background:#f7f3eb;padding:24px;color:#333"><div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:24px"><h2 style="margin:0 0 4px 0">Riepilogo ${escapeHtml(input.periodLabel)}</h2><p style="color:#555;margin:0 0 16px 0">${escapeHtml(input.aziendaNome)}</p><table style="width:100%;border-collapse:collapse" cellspacing="0"><thead><tr><th align="left">Data</th><th align="left">Tipo</th><th align="right">Totale</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="2" style="padding-top:12px;font-weight:600">Totale</td><td style="padding-top:12px;text-align:right;font-weight:600">${formatEuro(input.total)}</td></tr></tfoot></table></div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const euroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatEuro(n: number): string {
  return euroFormatter.format(n);
}

function formatDate(ts: Timestamp | { toDate(): Date } | Date | undefined): string {
  if (!ts) return "";
  const d = ts instanceof Date ? ts : (ts as { toDate(): Date }).toDate();
  return dateFormatter.format(d);
}
