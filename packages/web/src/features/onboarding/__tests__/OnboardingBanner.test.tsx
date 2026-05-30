import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { OnboardingBanner } from "../OnboardingBanner";

const STORAGE_KEY = "vet.onboardingDismissed";

function installStorage(): void {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: stub });
}

function renderBanner(node: ReactElement) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("OnboardingBanner", () => {
  beforeEach(() => {
    installStorage();
  });

  it("prompts the new user when nothing exists yet", () => {
    renderBanner(<OnboardingBanner hasAziende={false} hasAttivita={false} />);
    expect(screen.getByText(/Per iniziare/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nascondi" })).toBeInTheDocument();
  });

  it("renders nothing once both aziende and attivita exist", () => {
    renderBanner(<OnboardingBanner hasAziende hasAttivita />);
    expect(screen.queryByRole("button", { name: "Nascondi" })).toBeNull();
  });

  it("hides and persists the dismissal when the user clicks Nascondi", () => {
    renderBanner(<OnboardingBanner hasAziende={false} hasAttivita={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Nascondi" }));
    expect(screen.queryByRole("button", { name: "Nascondi" })).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("stays hidden across mounts once dismissed", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    renderBanner(<OnboardingBanner hasAziende={false} hasAttivita={false} />);
    expect(screen.queryByRole("button", { name: "Nascondi" })).toBeNull();
  });

  it("renders without crashing when reading storage throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled");
      },
    });
    renderBanner(<OnboardingBanner hasAziende={false} hasAttivita={false} />);
    expect(screen.getByRole("button", { name: "Nascondi" })).toBeInTheDocument();
  });

  it("still hides when persisting the dismissal throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("storage disabled");
        },
      } as unknown as Storage,
    });
    renderBanner(<OnboardingBanner hasAziende={false} hasAttivita={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Nascondi" }));
    expect(screen.queryByRole("button", { name: "Nascondi" })).toBeNull();
  });
});
