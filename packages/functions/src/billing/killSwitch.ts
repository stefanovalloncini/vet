import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { logger } from "firebase-functions/v2";
import { CloudBillingClient } from "@google-cloud/billing";
import { getRepositories } from "../infrastructure/composition.js";
import { escapeHtml } from "../shared/html.js";

const KILL_THRESHOLD = 5;
const ALERT_RECIPIENT = "stefano.valloncini@gmail.com";

interface BudgetNotification {
  budgetDisplayName: string;
  costAmount: number;
  costIntervalStart: string;
  budgetAmount: number;
  budgetAmountType: string;
  currencyCode: string;
}

export function shouldKill(costUsd: number, thresholdUsd: number): boolean {
  return Number.isFinite(costUsd) && costUsd >= thresholdUsd;
}

export function buildKillSwitchEmail(input: {
  projectId: string;
  cost: number;
  currency: string;
  budget: string;
  threshold: number;
}): string {
  return `<!doctype html><html lang="it"><body style="font-family:Georgia,serif;padding:24px;color:#333"><h2>Kill switch attivato</h2><p>Il progetto <strong>${escapeHtml(input.projectId)}</strong> ha superato la soglia di spesa configurata. Il billing è stato disabilitato automaticamente.</p><table style="border-collapse:collapse"><tr><td style="padding:4px 12px 4px 0">Budget</td><td><strong>${escapeHtml(input.budget)}</strong></td></tr><tr><td style="padding:4px 12px 4px 0">Costo attuale</td><td>${input.cost} ${escapeHtml(input.currency)}</td></tr><tr><td style="padding:4px 12px 4px 0">Soglia kill-switch</td><td>${input.threshold} ${escapeHtml(input.currency)}</td></tr></table><p>Per ripristinare il servizio, ri-collega il billing manualmente: <code>gcloud beta billing projects link ${escapeHtml(input.projectId)} --billing-account=...</code></p><p>Vedi il runbook <code>~/.claude/plans/Vet/RUNBOOKS/2026-incident-response.md</code> per la procedura completa.</p></body></html>`;
}

export function parseNotification(raw: unknown): BudgetNotification | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.costAmount !== "number") return null;
  if (typeof data.budgetAmount !== "number") return null;
  if (typeof data.currencyCode !== "string") return null;
  return {
    budgetDisplayName: typeof data.budgetDisplayName === "string" ? data.budgetDisplayName : "",
    costAmount: data.costAmount,
    costIntervalStart: typeof data.costIntervalStart === "string" ? data.costIntervalStart : "",
    budgetAmount: data.budgetAmount,
    budgetAmountType: typeof data.budgetAmountType === "string" ? data.budgetAmountType : "",
    currencyCode: data.currencyCode,
  };
}

export const killSwitchOnBudget = onMessagePublished(
  {
    topic: "billing-budget-alerts",
    region: "europe-west8",
    ingressSettings: "ALLOW_INTERNAL_ONLY",
  },
  async (event) => {
    const notification = parseNotification(event.data.message.json);
    if (!notification) {
      logger.warn("kill switch: malformed budget notification, ignoring");
      return;
    }

    logger.info("kill switch: budget notification received", {
      budget: notification.budgetDisplayName,
      cost: notification.costAmount,
      currency: notification.currencyCode,
      threshold: KILL_THRESHOLD,
    });

    if (!shouldKill(notification.costAmount, KILL_THRESHOLD)) return;

    const projectId = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT;
    if (!projectId) {
      logger.error("kill switch: missing GCLOUD_PROJECT env");
      return;
    }

    const projectName = `projects/${projectId}`;
    const billing = new CloudBillingClient();

    const [info] = await billing.getProjectBillingInfo({ name: projectName });
    if (info.billingEnabled === false) {
      logger.info("kill switch: billing already disabled, nothing to do");
      return;
    }

    await billing.updateProjectBillingInfo({
      name: projectName,
      projectBillingInfo: { billingAccountName: "" },
    });

    logger.error("KILL_SWITCH_TRIGGERED: billing disabled", {
      projectId,
      cost: notification.costAmount,
      currency: notification.currencyCode,
      threshold: KILL_THRESHOLD,
    });

    try {
      const repos = getRepositories();
      await repos.mail.send({
        to: ALERT_RECIPIENT,
        message: {
          subject: `[Vet] KILL SWITCH triggered — billing disabled (${projectId})`,
          html: buildKillSwitchEmail({
            projectId,
            cost: notification.costAmount,
            currency: notification.currencyCode,
            budget: notification.budgetDisplayName,
            threshold: KILL_THRESHOLD,
          }),
        },
        kind: "kill-switch-alert",
      });
    } catch (err) {
      logger.error("kill switch: alert email failed", {
        errorName: err instanceof Error ? err.name : "Unknown",
      });
    }
  }
);
