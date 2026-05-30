import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { getRepositories } from "../infrastructure/composition.js";
import { escapeHtml } from "../shared/html.js";
import { isCadenzaDue, periodFor, type Cadenza } from "./period.js";

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
    ingressSettings: "ALLOW_INTERNAL_ONLY",
  },
  async () => {
    const runAt = new Date();
    const repos = getRepositories();
    const aziende = await repos.aziende.list();

    for (const azienda of aziende) {
      const cadenza = azienda.cadenzaFatturazione as Cadenza | undefined;
      const email = azienda.emailFatturazione;
      if (!cadenza || !email) continue;
      if (!isCadenzaDue(cadenza, runAt)) continue;

      const period = periodFor(cadenza, runAt);
      const items = await repos.attivita.list({
        aziendaId: azienda.id,
        from: period.start,
        to: period.end,
      });
      if (items.length === 0) continue;

      const total = items.reduce((s, a) => s + a.totale, 0);
      const renderableItems: Attivita[] = items.map((a) => ({
        data: Timestamp.fromDate(a.data),
        aziendaNome: a.aziendaNome,
        tipoNome: a.tipoNome,
        tariffa: a.tariffa,
        ...(a.ore !== undefined ? { ore: a.ore } : {}),
        totale: a.totale,
        oraria: a.oraria,
        ...(a.note !== undefined ? { note: a.note } : {}),
      }));
      const html = renderHtmlReport({
        aziendaNome: azienda.nome,
        periodLabel: period.label,
        items: renderableItems,
        total,
      });

      await repos.mail.send({
        to: email,
        message: {
          subject: `Riepilogo attività ${period.label} — ${azienda.nome}`,
          html,
        },
        aziendaId: azienda.id,
        period: period.label,
      });

      await repos.audit.record({
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "invoicing.monthly.push",
        targetType: "azienda",
        targetId: azienda.id,
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
  return `<!doctype html><html lang="it"><body style="font-family:Georgia,serif;background:#f7f3eb;padding:24px;color:#333"><div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:24px"><h2 style="margin:0 0 4px 0">Riepilogo ${escapeHtml(input.periodLabel)}</h2><p style="color:#555;margin:0 0 4px 0">${escapeHtml(input.aziendaNome)}</p><p style="color:#888;margin:0 0 16px 0;font-size:12px;font-style:italic">Documento non fiscalmente valido — riepilogo prestazioni.</p><table style="width:100%;border-collapse:collapse" cellspacing="0"><thead><tr><th align="left">Data</th><th align="left">Tipo</th><th align="right">Totale</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="2" style="padding-top:12px;font-weight:600">Totale</td><td style="padding-top:12px;text-align:right;font-weight:600">${formatEuro(input.total)}</td></tr></tfoot></table></div></body></html>`;
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
