import { describe, expect, it } from "vitest";
import { parseReminder } from "../reminder.js";

const dueAt = new Date("2026-03-15T07:00:00.000Z");
const createdAt = new Date("2026-03-01T07:00:00.000Z");
const updatedAt = new Date("2026-03-02T07:00:00.000Z");

const validDoc = {
  aziendaId: "az-1",
  aziendaNome: "Cascina San Marco",
  titolo: "Richiamo vaccinazioni",
  dueAt,
  done: false,
  createdAt,
  updatedAt,
  createdBy: "uid-vet",
  schemaVersion: 1,
};

describe("parseReminder", () => {
  it("parses a valid reminder document into the entity", () => {
    const reminder = parseReminder("rem-1", validDoc);
    expect(reminder).toEqual({
      id: "rem-1",
      aziendaId: "az-1",
      aziendaNome: "Cascina San Marco",
      titolo: "Richiamo vaccinazioni",
      dueAt,
      done: false,
      createdAt,
      updatedAt,
      createdBy: "uid-vet",
      schemaVersion: 1,
    });
  });

  it("includes optional note and doneAt when present", () => {
    const doneAt = new Date("2026-03-16T07:00:00.000Z");
    const reminder = parseReminder("rem-1", {
      ...validDoc,
      done: true,
      doneAt,
      note: "fatto in stalla",
    });
    expect(reminder.note).toBe("fatto in stalla");
    expect(reminder.doneAt).toEqual(doneAt);
  });

  it("omits optional fields when absent", () => {
    const reminder = parseReminder("rem-1", validDoc);
    expect("note" in reminder).toBe(false);
    expect("doneAt" in reminder).toBe(false);
  });

  it("rejects an extra field via .strict()", () => {
    expect(() => parseReminder("rem-1", { ...validDoc, ghost: 1 })).toThrow();
  });

  it("rejects a missing required field", () => {
    const { titolo: _omit, ...without } = validDoc;
    void _omit;
    expect(() => parseReminder("rem-1", without)).toThrow();
  });

  it("rejects an empty or oversize titolo", () => {
    expect(() => parseReminder("rem-1", { ...validDoc, titolo: "" })).toThrow();
    expect(() =>
      parseReminder("rem-1", { ...validDoc, titolo: "t".repeat(121) })
    ).toThrow();
  });

  it("rejects oversize note beyond the cap", () => {
    expect(() =>
      parseReminder("rem-1", { ...validDoc, note: "n".repeat(501) })
    ).toThrow();
  });
});
