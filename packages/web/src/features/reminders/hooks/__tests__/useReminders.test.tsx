import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useCreateReminder,
  useDeleteReminder,
  useReminders,
  useUpdateReminder,
} from "../useReminders";

const actor: ActorContext = {
  uid: "u1",
  email: "u@x.it",
  displayName: "U",
  roleId: "vet",
  caps: new Set([
    "reminders.create",
    "reminders.update.own",
    "reminders.delete.own",
  ]),
  approved: true,
};

function wrap(repos: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

async function seed(repos: Repositories): Promise<string> {
  const { id: aziendaId } = await repos.aziende.create({ nome: "Cascina A" }, actor);
  await repos.reminders.create(
    {
      aziendaId,
      titolo: "Richiamo vaccinazione",
      dueAt: new Date("2026-06-01"),
    },
    { aziendaNome: "Cascina A" },
    actor
  );
  return aziendaId;
}

describe("useReminders", () => {
  it("loads reminders via tanstack query", async () => {
    const repos = createInMemoryRepositories();
    await seed(repos);

    const { result } = renderHook(() => useReminders(), {
      wrapper: wrap(repos),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("respects the onlyOpen filter", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await seed(repos);
    const { id } = await repos.reminders.create(
      {
        aziendaId,
        titolo: "Fatto",
        dueAt: new Date("2026-06-02"),
      },
      { aziendaNome: "Cascina A" },
      actor
    );
    await repos.reminders.markDone(id, true);

    const { result } = renderHook(() => useReminders({ onlyOpen: true }), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.reminders[0]?.done).toBe(false);
  });
});

describe("useCreateReminder", () => {
  it("creates a reminder and invalidates the list", async () => {
    const repos = createInMemoryRepositories();
    const { id: aziendaId } = await repos.aziende.create({ nome: "Cascina A" }, actor);
    const wrapper = wrap(repos);

    const { result: listResult } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(listResult.current.loading).toBe(false));
    expect(listResult.current.reminders).toHaveLength(0);

    const { result: createResult } = renderHook(() => useCreateReminder(), {
      wrapper,
    });
    await act(async () => {
      await createResult.current.mutateAsync({
        input: {
          aziendaId,
          titolo: "Controllo",
          dueAt: new Date("2026-06-10"),
        },
        denorm: { aziendaNome: "Cascina A" },
        actor,
      });
    });
    await waitFor(() =>
      expect(listResult.current.reminders).toHaveLength(1)
    );
  });
});

describe("useUpdateReminder", () => {
  it("toggles done state and refreshes the list", async () => {
    const repos = createInMemoryRepositories();
    await seed(repos);
    const wrapper = wrap(repos);

    const { result: listResult } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(listResult.current.loading).toBe(false));
    const target = listResult.current.reminders[0];
    expect(target).toBeDefined();
    expect(target?.done).toBe(false);

    const { result: updateResult } = renderHook(() => useUpdateReminder(), {
      wrapper,
    });
    await act(async () => {
      await updateResult.current.mutateAsync({
        id: target!.id,
        done: true,
      });
    });
    await waitFor(() =>
      expect(listResult.current.reminders[0]?.done).toBe(true)
    );
  });
});

describe("useDeleteReminder", () => {
  it("deletes a reminder and invalidates the list", async () => {
    const repos = createInMemoryRepositories();
    await seed(repos);
    const wrapper = wrap(repos);

    const { result: listResult } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(listResult.current.loading).toBe(false));
    const target = listResult.current.reminders[0];
    expect(target).toBeDefined();

    const { result: deleteResult } = renderHook(() => useDeleteReminder(), {
      wrapper,
    });
    await act(async () => {
      await deleteResult.current.mutateAsync(target!.id);
    });
    await waitFor(() =>
      expect(listResult.current.reminders).toHaveLength(0)
    );
  });
});
