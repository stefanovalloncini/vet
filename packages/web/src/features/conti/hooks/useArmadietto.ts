import { useEffect, useMemo, useRef, useState } from "react";
import { prorateArmadietto, type Azienda } from "@vet/shared";

export interface ArmadiettoState {
  applicable: boolean;
  attivo: boolean;
  setAttivo: (v: boolean) => void;
  importoStr: string;
  setImporto: (v: string) => void;
  importoNum: number | null;
  suggested: number;
}

export function useArmadietto(
  azienda: Azienda,
  fromDate: Date | null,
  toDate: Date | null
): ArmadiettoState {
  const canone = azienda.armadiettoCanoneAnnuo;
  const applicable = canone !== undefined && canone > 0;

  const suggested = useMemo(() => {
    if (!applicable || canone === undefined || !fromDate || !toDate) return 0;
    return prorateArmadietto(canone, fromDate, toDate);
  }, [applicable, canone, fromDate, toDate]);

  const [attivo, setAttivo] = useState(applicable);
  const [importoStr, setImporto] = useState(() =>
    suggested > 0 ? String(suggested) : ""
  );

  const lastSuggested = useRef(suggested);
  useEffect(() => {
    if (suggested !== lastSuggested.current) {
      lastSuggested.current = suggested;
      setImporto(suggested > 0 ? String(suggested) : "");
    }
  }, [suggested]);

  const importoNum = useMemo(() => {
    const n = Number(importoStr);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100) / 100;
  }, [importoStr]);

  return {
    applicable,
    attivo,
    setAttivo,
    importoStr,
    setImporto,
    importoNum,
    suggested,
  };
}
