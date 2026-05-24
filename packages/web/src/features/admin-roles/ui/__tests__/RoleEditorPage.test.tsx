import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import type { ActorContext, Capability, Role } from "@vet/shared";
import {
  InMemoryAuthService,
  InMemoryRoleRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { RoleEditorPage } from "../RoleEditorPage";

function makeUser(
  caps: ReadonlyArray<Capability> = ["roles.manage"]
): ActorContext {
  return {
    uid: "u1",
    email: "u@example.com",
    displayName: "Tester",
    roleId: "admin",
    caps: new Set(caps),
    approved: true,
  };
}

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: "vet-junior",
    name: "Vet junior",
    description: "Junior vet",
    capabilities: ["activities.create", "aziende.read"],
    locked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "seed",
    updatedBy: "seed",
    schemaVersion: 1,
    ...overrides,
  };
}

interface MountOptions {
  url: string;
  routePath: string;
  user?: ActorContext | null;
  seed?: Role[];
}

interface MountResult {
  repo: InMemoryRoleRepository;
}

async function mountEditor({
  url,
  routePath,
  user = makeUser(),
  seed = [],
}: MountOptions): Promise<MountResult> {
  const repo = new InMemoryRoleRepository();
  for (const r of seed) await repo.seed(r);
  const auth = new InMemoryAuthService();
  if (user) auth.setSimulatedUser(user);
  render(
    <Routes>
      <Route path={routePath} element={<RoleEditorPage />} />
      <Route path="/admin/ruoli" element={<div>roles-list</div>} />
    </Routes>,
    {
      wrapper: buildProvidersWrapper({
        repos: { roles: repo, auth },
        withRouter: true,
        initialEntries: [url],
      }),
    }
  );
  return { repo };
}

describe("RoleEditorPage", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders create-mode fields when the route is /admin/ruoli/nuovo", async () => {
    await mountEditor({ url: "/admin/ruoli/nuovo", routePath: "/admin/ruoli/nuovo" });
    expect(
      await screen.findByRole("heading", { level: 1, name: /Nuovo ruolo/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Identificativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome visibile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrizione/i)).toBeInTheDocument();
  });

  it("rejects an invalid id when creating a new role", async () => {
    const { repo } = await mountEditor({
      url: "/admin/ruoli/nuovo",
      routePath: "/admin/ruoli/nuovo",
    });
    await screen.findByLabelText(/Identificativo/i);
    fireEvent.change(screen.getByLabelText(/Identificativo/i), {
      target: { value: "Bad ID" },
    });
    fireEvent.change(screen.getByLabelText(/Nome visibile/i), {
      target: { value: "Vet trial" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    await waitFor(() => {
      const alerts = screen
        .getAllByRole("alert")
        .map((el) => el.textContent ?? "");
      expect(alerts.some((s) => /Lowercase, lettere e trattini/i.test(s))).toBe(
        true
      );
    });
    expect(await repo.getById("Bad ID")).toBeNull();
  });

  it("creates a new role on save and navigates to the list", async () => {
    const { repo } = await mountEditor({
      url: "/admin/ruoli/nuovo",
      routePath: "/admin/ruoli/nuovo",
    });
    await screen.findByLabelText(/Identificativo/i);
    fireEvent.change(screen.getByLabelText(/Identificativo/i), {
      target: { value: "vet-trial" },
    });
    fireEvent.change(screen.getByLabelText(/Nome visibile/i), {
      target: { value: "Vet trial" },
    });
    fireEvent.change(screen.getByLabelText(/Descrizione/i), {
      target: { value: "trial role" },
    });
    const firstCap = screen
      .getAllByRole("checkbox")
      .find((cb) => !(cb as HTMLInputElement).disabled);
    if (firstCap) fireEvent.click(firstCap);
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    await waitFor(async () => {
      expect(await repo.getById("vet-trial")).not.toBeNull();
    });
    expect(await screen.findByText("roles-list")).toBeInTheDocument();
    const created = await repo.getById("vet-trial");
    expect(created?.name).toBe("Vet trial");
    expect(created?.description).toBe("trial role");
    expect(created?.capabilities.length).toBeGreaterThan(0);
  });

  it("hydrates the form from useRole in edit mode", async () => {
    await mountEditor({
      url: "/admin/ruoli/vet-junior",
      routePath: "/admin/ruoli/:id",
      seed: [makeRole()],
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText(/Nome visibile/i) as HTMLInputElement).value
      ).toBe("Vet junior");
    });
    expect(
      (screen.getByLabelText(/Descrizione/i) as HTMLTextAreaElement).value
    ).toBe("Junior vet");
    expect(screen.queryByLabelText(/Identificativo/i)).toBeNull();
    const activityCreateCheckbox = await screen.findByRole("checkbox", {
      name: /activities\.create/i,
    });
    expect(activityCreateCheckbox).toBeChecked();
  });

  it("updates an existing role on save", async () => {
    const { repo } = await mountEditor({
      url: "/admin/ruoli/vet-junior",
      routePath: "/admin/ruoli/:id",
      seed: [makeRole()],
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText(/Nome visibile/i) as HTMLInputElement).value
      ).toBe("Vet junior");
    });
    fireEvent.change(screen.getByLabelText(/Nome visibile/i), {
      target: { value: "Vet renamed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    await waitFor(async () => {
      const updated = await repo.getById("vet-junior");
      expect(updated?.name).toBe("Vet renamed");
    });
    expect(await screen.findByText("roles-list")).toBeInTheDocument();
  });

  it("hides the save button when the role is locked", async () => {
    await mountEditor({
      url: "/admin/ruoli/admin",
      routePath: "/admin/ruoli/:id",
      seed: [makeRole({ id: "admin", name: "Admin", locked: true })],
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText(/Nome visibile/i) as HTMLInputElement).value
      ).toBe("Admin");
    });
    expect(screen.queryByRole("button", { name: /Salva/i })).toBeNull();
    expect(screen.getByText(/Ruolo bloccato/i)).toBeInTheDocument();
  });

  it("hides the save button when the user lacks roles.manage", async () => {
    await mountEditor({
      url: "/admin/ruoli/vet-junior",
      routePath: "/admin/ruoli/:id",
      seed: [makeRole()],
      user: makeUser(["roles.read"]),
    });
    await waitFor(() => {
      expect(
        (screen.getByLabelText(/Nome visibile/i) as HTMLInputElement).value
      ).toBe("Vet junior");
    });
    expect(screen.queryByRole("button", { name: /Salva/i })).toBeNull();
  });

  it("toggles a capability when the user clicks its checkbox", async () => {
    await mountEditor({
      url: "/admin/ruoli/nuovo",
      routePath: "/admin/ruoli/nuovo",
    });
    const cb = await screen.findByRole("checkbox", {
      name: /activities\.create/i,
    });
    expect(cb).not.toBeChecked();
    fireEvent.click(cb);
    expect(cb).toBeChecked();
    fireEvent.click(cb);
    expect(cb).not.toBeChecked();
  });

  it("navigates to the list when the role id does not exist", async () => {
    await mountEditor({
      url: "/admin/ruoli/missing",
      routePath: "/admin/ruoli/:id",
    });
    expect(await screen.findByText("roles-list")).toBeInTheDocument();
  });
});
