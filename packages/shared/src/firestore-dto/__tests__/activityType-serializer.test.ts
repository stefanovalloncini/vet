import { describe, expect, it } from "vitest";
import {
  activityTypeDtoSchema,
  buildActivityTypeCreateDoc,
  buildActivityTypeUpdateDoc,
  parseActivityType,
} from "../activityType.js";
import type { SerializerStampDeps } from "../_shared.js";

class TsStamp {
  constructor(readonly date: Date) {}
  toDate() {
    return this.date;
  }
}
class ServerStamp {
  constructor(readonly at: Date) {}
  toDate() {
    return this.at;
  }
}

const now = new Date("2026-05-01T00:00:00Z");
const deps: SerializerStampDeps<TsStamp, ServerStamp> = {
  fromDate: (d) => new TsStamp(d),
  serverTimestamp: () => new ServerStamp(now),
};

describe("buildActivityTypeCreateDoc", () => {
  it("emits all required fields plus optionals when provided", () => {
    const payload = buildActivityTypeCreateDoc(
      {
        input: {
          nome: "Ginecologia",
          ordine: 1,
          attivo: true,
          tariffaStandard: 80,
          modalitaDefault: "fissa",
        },
      },
      deps
    );
    expect(payload.nome).toBe("Ginecologia");
    expect(payload.ordine).toBe(1);
    expect(payload.attivo).toBe(true);
    expect(payload.tariffaStandard).toBe(80);
    expect(payload.modalitaDefault).toBe("fissa");
    expect(payload.schemaVersion).toBe(1);
    expect(payload.createdAt).toBeInstanceOf(ServerStamp);
    expect(payload.updatedAt).toBeInstanceOf(ServerStamp);
  });

  it("omits optional fields when not provided", () => {
    const payload = buildActivityTypeCreateDoc(
      {
        input: { nome: "Altro", ordine: 99, attivo: false },
      },
      deps
    );
    expect("tariffaStandard" in payload).toBe(false);
    expect("modalitaDefault" in payload).toBe(false);
  });

  it("round-trips through dto schema + parser", () => {
    const payload = buildActivityTypeCreateDoc(
      {
        input: {
          nome: "Ginecologia",
          ordine: 1,
          attivo: true,
          tariffaStandard: 80,
          modalitaDefault: "fissa",
        },
      },
      deps
    );
    expect(() => activityTypeDtoSchema.parse(payload)).not.toThrow();
    const entity = parseActivityType("at-1", payload);
    expect(entity.id).toBe("at-1");
    expect(entity.tariffaStandard).toBe(80);
    expect(entity.modalitaDefault).toBe("fissa");
    expect(entity.createdAt.getTime()).toBe(now.getTime());
  });
});

describe("buildActivityTypeUpdateDoc", () => {
  it("emits write-shaped patch with serverTimestamp updatedAt", () => {
    const patch = buildActivityTypeUpdateDoc(
      {
        input: {
          nome: "Altro",
          ordine: 99,
          attivo: true,
          modalitaDefault: "oraria",
        },
      },
      deps
    );
    expect(patch.nome).toBe("Altro");
    expect(patch.modalitaDefault).toBe("oraria");
    expect(patch.updatedAt).toBeInstanceOf(ServerStamp);
    expect("createdAt" in patch).toBe(false);
  });
});
