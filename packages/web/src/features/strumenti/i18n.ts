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
    label: "Ossitocina (10 UI = 0,5 ml su 20 UI/ml)",
    dosaggioMgPerKg: 0.5,
    concentrazioneMgPerMl: 20,
  },
  {
    id: "ivermectina-10",
    label: "Ivermectina 1% (10 mg/ml)",
    dosaggioMgPerKg: 0.2,
    concentrazioneMgPerMl: 10,
  },
  {
    id: "ceftiofur-50",
    label: "Ceftiofur 50 mg/ml",
    dosaggioMgPerKg: 1.1,
    concentrazioneMgPerMl: 50,
  },
  {
    id: "flunixin-50",
    label: "Flunixin 50 mg/ml",
    dosaggioMgPerKg: 2.2,
    concentrazioneMgPerMl: 50,
  },
  {
    id: "amoxicillina-150",
    label: "Amoxicillina LA 150 mg/ml",
    dosaggioMgPerKg: 15,
    concentrazioneMgPerMl: 150,
  },
  {
    id: "ketoprofene-100",
    label: "Ketoprofene 100 mg/ml",
    dosaggioMgPerKg: 3,
    concentrazioneMgPerMl: 100,
  },
];
