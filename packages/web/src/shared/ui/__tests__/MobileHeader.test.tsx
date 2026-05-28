import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { MobileHeader } from "../MobileHeader";

function wrap(theme: "light" | "dark", onToggle = vi.fn(), onLogout = vi.fn()) {
  return render(
    <MemoryRouter>
      <MobileHeader
        theme={theme}
        onThemeToggle={onToggle}
        onLogoutClick={onLogout}
      />
    </MemoryRouter>
  );
}

describe("MobileHeader", () => {
  it("exposes search, theme, settings and logout controls with labels", () => {
    wrap("light");
    expect(screen.getByRole("button", { name: /Cerca/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tema scuro/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Impostazioni/i })
    ).toHaveAttribute("href", "/impostazioni");
    expect(screen.getByRole("button", { name: /Esci/i })).toBeInTheDocument();
  });

  it("labels the theme toggle by the target theme", () => {
    wrap("dark");
    expect(
      screen.getByRole("button", { name: /Tema chiaro/i })
    ).toBeInTheDocument();
  });

  it("advertises the search keyboard shortcut", () => {
    wrap("light");
    expect(screen.getByRole("button", { name: /Cerca/i })).toHaveAttribute(
      "aria-keyshortcuts",
      "Meta+K Control+K"
    );
  });

  it("fires the theme and logout callbacks", () => {
    const onToggle = vi.fn();
    const onLogout = vi.fn();
    wrap("light", onToggle, onLogout);
    fireEvent.click(screen.getByRole("button", { name: /Tema scuro/i }));
    fireEvent.click(screen.getByRole("button", { name: /Esci/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("sizes every control to a 44px touch target", () => {
    wrap("light");
    const controls = [
      screen.getByRole("button", { name: /Cerca/i }),
      screen.getByRole("button", { name: /Tema scuro/i }),
      screen.getByRole("link", { name: /Impostazioni/i }),
      screen.getByRole("button", { name: /Esci/i }),
    ];
    for (const el of controls) {
      expect(el.className).toContain("h-11");
      expect(el.className).toContain("w-11");
    }
  });
});
