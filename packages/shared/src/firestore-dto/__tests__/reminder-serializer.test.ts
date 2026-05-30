import { describe, expect, it } from "vitest";
import { buildReminderMarkDonePatch, parseReminder } from "../reminder.js";

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

  it("parses a doc whose doneAt was cleared to null (un-done reminder)", () => {
    const reminder = parseReminder("rem-1", {
      ...validDoc,
      done: false,
      doneAt: null,
    });
    expect(reminder.done).toBe(false);
    expect("doneAt" in reminder).toBe(false);
  });

  it("round-trips the mark-not-done patch through the parser", () => {
    const deps = { fromDate: (d: Date) => d, serverTimestamp: () => new Date() };
    const patch = buildReminderMarkDonePatch({ done: false }, deps);
    const merged = { ...validDoc, ...patch };
    expect(() => parseReminder("rem-1", merged)).not.toThrow();
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

describe("buildReminderMarkDonePatch", () => {
  const deps = { fromDate: (d: Date) => d, serverTimestamp: () => "SERVER_TS" };

  it("sets doneAt to the server stamp when marking done", () => {
    expect(buildReminderMarkDonePatch({ done: true }, deps)).toEqual({
      done: true,
      updatedAt: "SERVER_TS",
      doneAt: "SERVER_TS",
    });
  });

  it("clears doneAt to null when un-marking", () => {
    expect(buildReminderMarkDonePatch({ done: false }, deps)).toEqual({
      done: false,
      updatedAt: "SERVER_TS",
      doneAt: null,
    });
  });
});
