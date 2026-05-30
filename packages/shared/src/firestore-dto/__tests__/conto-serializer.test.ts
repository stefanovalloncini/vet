import { describe, expect, it } from "vitest";
import {
  buildContoEmitDoc,
  contoDtoSchema,
  parseConto,
  type SerializerStampDeps,
} from "../conto.js";
import type { ActorContext } from "../../domain/entities/ActorContext.js";
import type { ContoEmitInput } from "../../domain/schemas/conto.js";

const actor: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["conti.emit"]),
  approved: true,
};

const input: ContoEmitInput = {
  aziendaId: "az-1",
  periodoFrom: new Date("2026-01-01T00:00:00Z"),
  periodoTo: new Date("2026-03-31T23:59:59Z"),
  modalita: "emesso",
};

const denorm = {
  aziendaNome: "Cascina Verdi",
  attivitaIds: ["a1", "a2"],
  totaleConto: 250,
};

class TsStamp {
  constructor(readonly date: Date) {}
  toDate() {
    return this.date;
  }
}
class ServerStampSentinel {
  constructor(readonly at: Date) {}
  toDate() {
    return this.at;
  }
}

const now = new Date("2026-04-15T08:30:00Z");
const deps: SerializerStampDeps<TsStamp, ServerStampSentinel> = {
  fromDate: (d) => new TsStamp(d),
  serverTimestamp: () => new ServerStampSentinel(now),
};

describe("buildContoEmitDoc", () => {
  it("maps input + denorm + actor into the emit payload", () => {
    const payload = buildContoEmitDoc({ input, denorm, actor }, deps);
    expect(payload.aziendaId).toBe("az-1");
    expect(payload.aziendaNome).toBe("Cascina Verdi");
    expect(payload.attivitaIds).toEqual(["a1", "a2"]);
    expect(payload.totaleConto).toBe(250);
    expect(payload.modalita).toBe("emesso");
    expect(payload.emittedBy).toBe("vet-1");
    expect(payload.emittedByName).toBe("Vet One");
    expect(payload.saldato).toBe(false);
    expect(payload.isDeleted).toBe(false);
    expect(payload.schemaVersion).toBe(1);
  });

  it("rejects a totaleConto with more than two decimals", () => {
    expect(() =>
      buildContoEmitDoc(
        { input, denorm: { ...denorm, totaleConto: 100.005 }, actor },
        deps
      )
    ).toThrow();
  });

  it("rejects a negative or out-of-range totaleConto", () => {
    expect(() =>
      buildContoEmitDoc(
        { input, denorm: { ...denorm, totaleConto: -1 }, actor },
        deps
      )
    ).toThrow();
    expect(() =>
      buildContoEmitDoc(
        { input, denorm: { ...denorm, totaleConto: 2_400_001 }, actor },
        deps
      )
    ).toThrow();
  });

  it("accepts a clean two-decimal totaleConto", () => {
    expect(() =>
      buildContoEmitDoc(
        { input, denorm: { ...denorm, totaleConto: 19.99 }, actor },
        deps
      )
    ).not.toThrow();
  });

  it("uses deps.fromDate for period bounds", () => {
    const payload = buildContoEmitDoc({ input, denorm, actor }, deps);
    expect(payload.periodoFrom).toBeInstanceOf(TsStamp);
    expect(payload.periodoTo).toBeInstanceOf(TsStamp);
    expect((payload.periodoFrom as TsStamp).date.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
    expect((payload.periodoTo as TsStamp).date.toISOString()).toBe(
      "2026-03-31T23:59:59.000Z"
    );
  });

  it("uses deps.serverTimestamp for emittedAt", () => {
    const payload = buildContoEmitDoc({ input, denorm, actor }, deps);
    expect(payload.emittedAt).toBeInstanceOf(ServerStampSentinel);
    expect((payload.emittedAt as ServerStampSentinel).at).toBe(now);
  });

  it("clones attivitaIds so later caller mutation does not leak", () => {
    const ids = ["a1", "a2"];
    const payload = buildContoEmitDoc(
      { input, denorm: { ...denorm, attivitaIds: ids }, actor },
      deps
    );
    ids.push("a3");
    expect(payload.attivitaIds).toEqual(["a1", "a2"]);
  });

  it("produces a payload that round-trips through contoDtoSchema + parseConto", () => {
    const payload = buildContoEmitDoc({ input, denorm, actor }, deps);
    const parsed = contoDtoSchema.parse(payload);
    expect(parsed.aziendaId).toBe("az-1");

    const entity = parseConto("conto-1", payload);
    expect(entity.id).toBe("conto-1");
    expect(entity.aziendaId).toBe("az-1");
    expect(entity.aziendaNome).toBe("Cascina Verdi");
    expect(entity.attivitaIds).toEqual(["a1", "a2"]);
    expect(entity.totaleConto).toBe(250);
    expect(entity.modalita).toBe("emesso");
    expect(entity.saldato).toBe(false);
    expect(entity.isDeleted).toBe(false);
    expect(entity.emittedAt.getTime()).toBe(now.getTime());
    expect(entity.periodoFrom.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
    expect(entity.periodoTo.toISOString()).toBe(
      "2026-03-31T23:59:59.000Z"
    );
  });

  it("includes armadiettoImporto from input when present", () => {
    const payload = buildContoEmitDoc(
      { input: { ...input, armadiettoImporto: 200 }, denorm, actor },
      deps
    );
    expect(payload.armadiettoImporto).toBe(200);
  });

  it("omits armadiettoImporto when not provided", () => {
    const payload = buildContoEmitDoc({ input, denorm, actor }, deps);
    expect("armadiettoImporto" in payload).toBe(false);
  });

  it("round-trips armadiettoImporto through schema + parseConto", () => {
    const payload = buildContoEmitDoc(
      { input: { ...input, armadiettoImporto: 200 }, denorm, actor },
      deps
    );
    const entity = parseConto("conto-1", payload);
    expect(entity.armadiettoImporto).toBe(200);
  });

  it("rejects unknown keys via .strict() when fed back to the schema", () => {
    const payload = buildContoEmitDoc({ input, denorm, actor }, deps);
    const withExtra = { ...payload, extra: "nope" };
    expect(() => contoDtoSchema.parse(withExtra)).toThrow();
  });
});
