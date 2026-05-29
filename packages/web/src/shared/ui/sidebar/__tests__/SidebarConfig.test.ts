import { describe, expect, it } from "vitest";
import { NAV_SECTIONS, visibleItems } from "../SidebarConfig";

function amministrazioneSection() {
  const section = NAV_SECTIONS.find((s) => s.title === "Amministrazione");
  if (!section) throw new Error("Amministrazione section not found");
  return section;
}

const ADMIN_CAPS: ReadonlySet<string> = new Set([
  "activity_types.manage",
  "roles.read",
  "allowlist.read",
  "audit.read",
  "users.read.all",
]);

// Non-admins hold activity_types.read (for the type dropdowns) but never .manage.
const NON_ADMIN_CAPS: ReadonlySet<string> = new Set([
  "activities.read.all",
  "aziende.read",
  "activity_types.read",
  "conti.proforma",
  "trash.read.own",
]);

describe("AMMINISTRAZIONE section visibility", () => {
  it("shows every administration item to an administrator", () => {
    const section = amministrazioneSection();
    expect(visibleItems(section.items, ADMIN_CAPS)).toHaveLength(
      section.items.length
    );
  });

  it("hides the entire section from non-admins, including Tipi attività", () => {
    const section = amministrazioneSection();
    const items = visibleItems(section.items, NON_ADMIN_CAPS);
    expect(items).toHaveLength(0);
    expect(items.some((i) => i.to === "/admin/tipi-attivita")).toBe(false);
  });
});
