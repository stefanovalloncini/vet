import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { logger } from "firebase-functions/v2";
import { CloudBillingClient } from "@google-cloud/billing";

const KILL_THRESHOLD = 5;

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
  }
);
