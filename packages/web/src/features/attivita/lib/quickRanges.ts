import { dateInputValue, mondayIndex } from "../../../shared/lib/format";

export interface QuickRange {
  id: string;
  label: string;
  compute: (now: Date) => { from: string; to: string };
}

export const QUICK_RANGES: ReadonlyArray<QuickRange> = [
  {
    id: "today",
    label: "Oggi",
    compute: (now: Date) => ({
      from: dateInputValue(now),
      to: dateInputValue(now),
    }),
  },
  {
    id: "week",
    label: "Questa settimana",
    compute: (now: Date) => {
      const day = mondayIndex(now);
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
  {
    id: "month",
    label: "Questo mese",
    compute: (now: Date) => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
  {
    id: "lastmonth",
    label: "Mese scorso",
    compute: (now: Date) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
  {
    id: "year",
    label: "Anno",
    compute: (now: Date) => {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: dateInputValue(start), to: dateInputValue(end) };
    },
  },
];
