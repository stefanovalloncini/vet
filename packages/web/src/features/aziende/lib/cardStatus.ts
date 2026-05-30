import { statoFor, type StatoKey, type StatoMeta } from "../../pagamenti";

export type StatusTone = StatoMeta["tone"];
export type StatusKey = StatoKey;

export interface Status {
  tone: StatusTone;
  label: string;
  key: StatusKey;
}

const CARD_LABEL: Record<StatoKey, string> = {
  unpaid: "Conti non saldati",
  todo: "Da emettere",
  ok: "Tutto saldato",
};

export function statusFor(
  hasUnsaldatiConti: boolean,
  needsNewConto: boolean
): Status {
  const meta = statoFor({ hasUnpaid: hasUnsaldatiConti, needsNewConto });
  return { tone: meta.tone, label: CARD_LABEL[meta.key], key: meta.key };
}
