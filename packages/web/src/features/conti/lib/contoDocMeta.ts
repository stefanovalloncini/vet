interface ContoFilenameArgs {
  modalita: "proforma" | "emesso";
  aziendaNomeNorm: string;
  emessoIl: Date;
}

export function contoFilenameStem({
  modalita,
  aziendaNomeNorm,
  emessoIl,
}: ContoFilenameArgs): string {
  const yyyy = emessoIl.getFullYear();
  const mm = String(emessoIl.getMonth() + 1).padStart(2, "0");
  const dd = String(emessoIl.getDate()).padStart(2, "0");
  const stem = modalita === "proforma" ? "proforma" : "conto";
  return `${stem}_${aziendaNomeNorm || "azienda"}_${yyyy}${mm}${dd}`;
}

export function contoNumeroFor(d: Date): string {
  const yyyy = d.getFullYear();
  const ts = `${d.getMonth() + 1}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  return `${yyyy}-${ts}`;
}
