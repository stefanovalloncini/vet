import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createQueryClient,
  registerMutationErrorNotifier,
} from "../queryClient";

describe("createQueryClient mutationCache.onError", () => {
  afterEach(() => {
    registerMutationErrorNotifier(null);
  });

  it("forwards the error message to the registered notifier", async () => {
    const notifier = vi.fn();
    registerMutationErrorNotifier(notifier);
    const client = createQueryClient();

    await expect(
      client
        .getMutationCache()
        .build(client, {
          mutationFn: () => {
            throw new Error("Boom");
          },
        })
        .execute(undefined)
    ).rejects.toThrow("Boom");

    expect(notifier).toHaveBeenCalledTimes(1);
    expect(notifier).toHaveBeenCalledWith("Boom", "error");
  });

  it("suppresses the toast when meta.silent is true", async () => {
    const notifier = vi.fn();
    registerMutationErrorNotifier(notifier);
    const client = createQueryClient();

    await expect(
      client
        .getMutationCache()
        .build(client, {
          mutationFn: () => {
            throw new Error("Silent boom");
          },
          meta: { silent: true },
        })
        .execute(undefined)
    ).rejects.toThrow("Silent boom");

    expect(notifier).not.toHaveBeenCalled();
  });

  it("uses meta.errorMessage as the toast text when provided", async () => {
    const notifier = vi.fn();
    registerMutationErrorNotifier(notifier);
    const client = createQueryClient();

    await expect(
      client
        .getMutationCache()
        .build(client, {
          mutationFn: () => {
            throw new Error("Raw error");
          },
          meta: { errorMessage: "Specific message" },
        })
        .execute(undefined)
    ).rejects.toThrow("Raw error");

    expect(notifier).toHaveBeenCalledTimes(1);
    expect(notifier).toHaveBeenCalledWith("Specific message", "error");
  });

  it("falls back to the Italian generic message when error has no message", async () => {
    const notifier = vi.fn();
    registerMutationErrorNotifier(notifier);
    const client = createQueryClient();

    await expect(
      client
        .getMutationCache()
        .build(client, {
          mutationFn: () => {
            throw "not an error instance";
          },
        })
        .execute(undefined)
    ).rejects.toBeDefined();

    expect(notifier).toHaveBeenCalledTimes(1);
    expect(notifier).toHaveBeenCalledWith(
      "Operazione non riuscita. Riprova.",
      "error"
    );
  });

  it("does nothing when no notifier is registered", async () => {
    registerMutationErrorNotifier(null);
    const client = createQueryClient();

    await expect(
      client
        .getMutationCache()
        .build(client, {
          mutationFn: () => {
            throw new Error("Boom");
          },
        })
        .execute(undefined)
    ).rejects.toThrow("Boom");
  });
});
