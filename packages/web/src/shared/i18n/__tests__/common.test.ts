import { describe, expect, it } from "vitest";
import { common } from "../common";

describe("common i18n dictionary", () => {
  it("matches the expected snapshot (any drift must be reviewed)", () => {
    expect({ ...common }).toEqual({
      salva: "Salva",
      annulla: "Annulla",
      elimina: "Elimina",
      modifica: "Modifica",
      back: "Torna indietro",
      loading: "Caricamento…",
      loadError: "Caricamento fallito.",
      saveError: "Salvataggio non riuscito.",
      operazioneNonRiuscita: "Operazione non riuscita.",
      riprova: "Riprova",
      note: "Note",
      data: "Data",
      tipo: "Tipo",
      totale: "Totale",
      azienda: "Azienda",
      periodo: "Periodo",
      da: "Da",
      a: "A",
      oggi: "Oggi",
      giorni: "giorni",
      tutti: "Tutti",
      tutte: "Tutte",
    });
  });

  it("exposes core action labels in Italian", () => {
    expect(common.salva).toBe("Salva");
    expect(common.annulla).toBe("Annulla");
    expect(common.elimina).toBe("Elimina");
    expect(common.modifica).toBe("Modifica");
  });

  it("exposes loading and error labels", () => {
    expect(common.loading).toBe("Caricamento…");
    expect(common.loadError).toBe("Caricamento fallito.");
    expect(common.saveError).toBe("Salvataggio non riuscito.");
  });
});
