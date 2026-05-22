import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteBoundary } from "../RouteBoundary";

function Boom({ when }: { when: boolean }) {
  if (when) throw new Error("kaboom");
  return <p>healthy child</p>;
}

function mount(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

let errSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errSpy.mockRestore();
});

describe("RouteBoundary", () => {
  it("renders children when no error is thrown", () => {
    mount(
      <RouteBoundary>
        <Boom when={false} />
      </RouteBoundary>
    );
    expect(screen.getByText("healthy child")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Riprova/i })).toBeNull();
  });

  it("shows the Italian error UI when a child throws", () => {
    mount(
      <RouteBoundary>
        <Boom when />
      </RouteBoundary>
    );
    expect(
      screen.getByText(/Si è verificato un errore caricando questa pagina/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Riprova/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ricarica/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vai alla home/i })).toBeInTheDocument();
  });

  it("recovers via Riprova when the child stops throwing", () => {
    function Harness() {
      const [crash, setCrash] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setCrash(false)}>
            fix
          </button>
          <RouteBoundary>
            <Boom when={crash} />
          </RouteBoundary>
        </>
      );
    }
    mount(<Harness />);
    expect(
      screen.getByText(/Si è verificato un errore caricando questa pagina/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /fix/i }));
    fireEvent.click(screen.getByRole("button", { name: /Riprova/i }));
    expect(screen.getByText("healthy child")).toBeInTheDocument();
  });

  it("re-throws when Riprova is clicked and the child still throws", () => {
    mount(
      <RouteBoundary>
        <Boom when />
      </RouteBoundary>
    );
    fireEvent.click(screen.getByRole("button", { name: /Riprova/i }));
    expect(
      screen.getByText(/Si è verificato un errore caricando questa pagina/i)
    ).toBeInTheDocument();
  });

  it("resets the boundary when resetKeys change", () => {
    function Harness() {
      const [key, setKey] = useState("a");
      const [crash, setCrash] = useState(true);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setCrash(false);
              setKey("b");
            }}
          >
            navigate
          </button>
          <RouteBoundary resetKeys={[key]}>
            <Boom when={crash} />
          </RouteBoundary>
        </>
      );
    }
    mount(<Harness />);
    expect(
      screen.getByText(/Si è verificato un errore caricando questa pagina/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /navigate/i }));
    expect(screen.getByText("healthy child")).toBeInTheDocument();
  });
});
