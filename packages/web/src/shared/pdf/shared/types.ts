import type { Azienda, Attivita } from "@vet/shared";

export interface ContoPdfData {
  azienda: Pick<
    Azienda,
    "nome" | "indirizzo" | "piva" | "emailFatturazione" | "telefono"
  >;
  righe: ReadonlyArray<Attivita>;
  periodo: { from: Date; to: Date };
  /** Sequential invoice number, format "2026-001" */
  numero: string;
  emessoIl: Date;
  emessoDa: { uid: string; displayName: string };
  totale: number;
  armadietto?: number;
  note?: string;
}

export interface ProformaPdfData {
  azienda: Pick<
    Azienda,
    "nome" | "indirizzo" | "piva" | "emailFatturazione" | "telefono"
  >;
  righe: ReadonlyArray<Attivita>;
  periodo: { from: Date; to: Date };
  emessoIl: Date;
  emessoDa: { uid: string; displayName: string };
  totale: number;
  armadietto?: number;
}

export interface RiepilogoPdfData {
  azienda: Pick<Azienda, "nome" | "indirizzo" | "piva" | "emailFatturazione">;
  righe: ReadonlyArray<Attivita>;
  periodo: { from: Date | null; to: Date | null };
  emessoIl: Date;
  vetName?: string;
  totale: number;
}
