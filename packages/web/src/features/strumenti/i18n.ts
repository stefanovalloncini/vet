export const strumentiI18n = {
  title: "Strumenti",
  subtitle: "Bedside tools per il quotidiano in campo.",
  // dosaggio
  dosaggioTitle: "Calcolatore dosaggio",
  dosaggioSubtitle: "Peso × mg/kg ÷ concentrazione = ml da somministrare.",
  pesoLabel: "Peso animale (kg)",
  dosaggioLabel: "Dosaggio (mg/kg)",
  concentrazioneLabel: "Concentrazione (mg/ml)",
  risultatoLabel: "Da somministrare",
  preset: "Preset",
  presetCustom: "Personalizzato",
  sospensione: "Sospensione",
  sospensioneCarne: "Carne",
  sospensioneLatte: "Latte",
  giorni: "giorni",
  hint: "Verifica sempre il foglio illustrativo. I valori qui sono indicativi.",
  // converter
  convertitoreTitle: "Convertitore unità",
  convertitoreSubtitle: "Cambi al volo fra unità comuni.",
  da: "Da",
  a: "A",
} as const;

export interface DosagePreset {
  id: string;
  label: string;
  dosaggioMgPerKg: number;
  concentrazioneMgPerMl: number;
  sospensioneCarne?: number;
  sospensioneLatte?: number;
  via?: string;
}

export const DOSAGE_PRESETS: DosagePreset[] = [
  {
    id: "custom",
    label: "Personalizzato",
    dosaggioMgPerKg: 0,
    concentrazioneMgPerMl: 0,
  },
  {
    id: "ossitocina-20",
    label: "Ossitocina (UI/ml 20)",
    dosaggioMgPerKg: 0.5,
    concentrazioneMgPerMl: 20,
    via: "IM/SC",
    sospensioneCarne: 0,
    sospensioneLatte: 0,
  },
  {
    id: "ivermectina-10",
    label: "Ivermectina 1% (10 mg/ml)",
    dosaggioMgPerKg: 0.2,
    concentrazioneMgPerMl: 10,
    via: "SC",
    sospensioneCarne: 49,
    sospensioneLatte: -1,
  },
  {
    id: "ceftiofur-50",
    label: "Ceftiofur 50 mg/ml",
    dosaggioMgPerKg: 1.1,
    concentrazioneMgPerMl: 50,
    via: "IM/SC",
    sospensioneCarne: 8,
    sospensioneLatte: 0,
  },
  {
    id: "flunixin-50",
    label: "Flunixin 50 mg/ml",
    dosaggioMgPerKg: 2.2,
    concentrazioneMgPerMl: 50,
    via: "EV",
    sospensioneCarne: 7,
    sospensioneLatte: 1,
  },
  {
    id: "amoxicillina-150",
    label: "Amoxicillina LA 150 mg/ml",
    dosaggioMgPerKg: 15,
    concentrazioneMgPerMl: 150,
    via: "IM",
    sospensioneCarne: 42,
    sospensioneLatte: 4,
  },
  {
    id: "ketoprofene-100",
    label: "Ketoprofene 100 mg/ml",
    dosaggioMgPerKg: 3,
    concentrazioneMgPerMl: 100,
    via: "EV/IM",
    sospensioneCarne: 4,
    sospensioneLatte: 0,
  },
  {
    id: "oxitetraciclina-200",
    label: "Oxitetraciclina LA 200 mg/ml",
    dosaggioMgPerKg: 20,
    concentrazioneMgPerMl: 200,
    via: "IM",
    sospensioneCarne: 28,
    sospensioneLatte: 7,
  },
  {
    id: "tilmicosina-300",
    label: "Tilmicosina 300 mg/ml",
    dosaggioMgPerKg: 10,
    concentrazioneMgPerMl: 300,
    via: "SC",
    sospensioneCarne: 70,
    sospensioneLatte: -1,
  },
];
