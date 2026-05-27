type RouteParam = string;

type ParamRecord<TParams extends ReadonlyArray<string>> = {
  readonly [K in TParams[number]]: RouteParam;
};

interface RouteWithParams<TParams extends ReadonlyArray<string>> {
  readonly path: string;
  readonly to: (params: ParamRecord<TParams>) => string;
}

interface RouteWithoutParams {
  readonly path: string;
  readonly to: () => string;
}

function buildPath(
  template: string,
  params: Readonly<Record<string, RouteParam>>
): string {
  let out = template;
  for (const [key, value] of Object.entries(params)) {
    out = out.replace(new RegExp(`:${key}(?=/|$)`, "g"), encodeURIComponent(value));
  }
  return out;
}

function staticRoute(path: string): RouteWithoutParams {
  return { path, to: () => path };
}

function paramRoute<const TParams extends ReadonlyArray<string>>(
  path: string,
  _params: TParams
): RouteWithParams<TParams> {
  return {
    path,
    to: (params) => buildPath(path, params as Record<string, RouteParam>),
  };
}

/**
 * Typed route registry. Use `routes.x.path` for `<Route>` declarations and
 * `routes.x.to(params)` for navigation — both stay in sync with the URL.
 */
export const routes = {
  home: staticRoute("/"),

  attivita: staticRoute("/attivita"),
  attivitaNew: staticRoute("/attivita/nuova"),
  attivitaEdit: paramRoute("/attivita/:id", ["id"] as const),

  aziende: staticRoute("/aziende"),
  aziendaNew: staticRoute("/aziende/nuova"),
  aziendaDetail: paramRoute("/aziende/:id", ["id"] as const),
  aziendaEdit: paramRoute("/aziende/:id/modifica", ["id"] as const),
  aziendaRiepilogo: paramRoute("/aziende/:id/riepilogo", ["id"] as const),

  conti: staticRoute("/conti"),
  pagamenti: staticRoute("/pagamenti"),

  agenda: staticRoute("/agenda"),
  riepilogo: staticRoute("/riepilogo"),
  statistiche: staticRoute("/statistiche"),
  promemoria: staticRoute("/promemoria"),

  cestino: staticRoute("/cestino"),
  impostazioni: staticRoute("/impostazioni"),

  strumenti: staticRoute("/strumenti"),
  strumentiDosaggio: staticRoute("/strumenti/dosaggio"),

  adminTipiAttivita: staticRoute("/admin/tipi-attivita"),
  adminAllowlist: staticRoute("/admin/allowlist"),
  adminAudit: staticRoute("/admin/audit"),
  adminStatsVet: staticRoute("/admin/stats-vet"),
  adminRoles: staticRoute("/admin/ruoli"),
  adminRoleNew: staticRoute("/admin/ruoli/nuovo"),
  adminRoleEdit: paramRoute("/admin/ruoli/:id", ["id"] as const),
} as const;

export type RouteKey = keyof typeof routes;
