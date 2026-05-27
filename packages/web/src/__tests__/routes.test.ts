import { describe, expect, it } from "vitest";
import { routes } from "../routes";

describe("routes registry", () => {
  it("static routes return their own path from to()", () => {
    expect(routes.aziende.to()).toBe("/aziende");
    expect(routes.pagamenti.to()).toBe("/pagamenti");
    expect(routes.adminAudit.to()).toBe("/admin/audit");
  });

  it("param routes substitute :id with encoded value", () => {
    expect(routes.aziendaDetail.to({ id: "abc123" })).toBe("/aziende/abc123");
    expect(routes.attivitaEdit.to({ id: "xyz" })).toBe("/attivita/xyz");
    expect(routes.aziendaRiepilogo.to({ id: "company-1" })).toBe(
      "/aziende/company-1/riepilogo"
    );
  });

  it("param routes URL-encode values with special characters", () => {
    expect(routes.aziendaDetail.to({ id: "with space" })).toBe(
      "/aziende/with%20space"
    );
    expect(routes.aziendaDetail.to({ id: "a/b" })).toBe("/aziende/a%2Fb");
  });

  it("path templates preserve :param tokens for react-router matching", () => {
    expect(routes.aziendaDetail.path).toBe("/aziende/:id");
    expect(routes.aziendaEdit.path).toBe("/aziende/:id/modifica");
    expect(routes.adminRoleEdit.path).toBe("/admin/ruoli/:id");
  });
});
