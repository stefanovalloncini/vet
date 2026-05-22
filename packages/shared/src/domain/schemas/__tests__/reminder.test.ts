import { describe, expect, it } from "vitest";
import { reminderInputSchema, reminderDocSchema } from "../reminder.js";

describe("reminderInputSchema", () => {
  it("accepts a minimal reminder", () => {
    expect(
      reminderInputSchema.safeParse({
        aziendaId: "az1",
        titolo: "Richiamo vaccinazione",
        dueAt: new Date("2026-06-01T09:00:00Z"),
      }).success
    ).toBe(true);
  });

  it("rejects empty titolo", () => {
    expect(
      reminderInputSchema.safeParse({
        aziendaId: "az1",
        titolo: "",
        dueAt: new Date(),
      }).success
    ).toBe(false);
  });

  it("rejects titolo longer than 120 chars", () => {
    expect(
      reminderInputSchema.safeParse({
        aziendaId: "az1",
        titolo: "x".repeat(121),
        dueAt: new Date(),
      }).success
    ).toBe(false);
  });

  it("rejects aziendaId longer than 64 chars", () => {
    expect(
      reminderInputSchema.safeParse({
        aziendaId: "x".repeat(65),
        titolo: "Richiamo",
        dueAt: new Date(),
      }).success
    ).toBe(false);
  });

  it("rejects note longer than 500 chars", () => {
    expect(
      reminderInputSchema.safeParse({
        aziendaId: "az1",
        titolo: "Richiamo",
        dueAt: new Date(),
        note: "x".repeat(501),
      }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      reminderInputSchema.safeParse({
        aziendaId: "az1",
        titolo: "Richiamo",
        dueAt: new Date(),
        sneaky: 1,
      }).success
    ).toBe(false);
  });
});

describe("reminderDocSchema", () => {
  const base = {
    aziendaId: "az1",
    aziendaNome: "Cascina",
    titolo: "Richiamo",
    dueAt: new Date("2026-06-01T09:00:00Z"),
    done: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "uid1",
    schemaVersion: 1 as const,
  };

  it("accepts a valid doc", () => {
    expect(reminderDocSchema.safeParse(base).success).toBe(true);
  });

  it("accepts doneAt when done is true", () => {
    expect(
      reminderDocSchema.safeParse({
        ...base,
        done: true,
        doneAt: new Date(),
      }).success
    ).toBe(true);
  });

  it("rejects createdBy longer than 128 chars", () => {
    expect(
      reminderDocSchema.safeParse({ ...base, createdBy: "x".repeat(129) }).success
    ).toBe(false);
  });

  it("requires createdBy", () => {
    const { createdBy: _, ...withoutCreator } = base;
    expect(reminderDocSchema.safeParse(withoutCreator).success).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      reminderDocSchema.safeParse({ ...base, leak: true }).success
    ).toBe(false);
  });
});
