import { pagamentiI18n as t } from "../i18n";

export type StatoKey = "ok" | "unpaid" | "todo";

export interface StatoMeta {
  key: StatoKey;
  tone: "success" | "warning" | "danger";
  label: string;
}

const BY_KEY: Record<StatoKey, StatoMeta> = {
  ok: { key: "ok", tone: "success", label: t.statoOk },
  unpaid: { key: "unpaid", tone: "danger", label: t.statoUnpaid },
  todo: { key: "todo", tone: "warning", label: t.statoTodo },
};

export function statoForKey(key: StatoKey): StatoMeta {
  return BY_KEY[key];
}

export function statoFor(opts: {
  hasUnpaid: boolean;
  needsNewConto: boolean;
}): StatoMeta {
  if (opts.hasUnpaid) return BY_KEY.unpaid;
  if (opts.needsNewConto) return BY_KEY.todo;
  return BY_KEY.ok;
}
