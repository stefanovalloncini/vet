import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useAttivitaFilters } from "../useAttivitaFilters";

function wrapperWithUrl(initialUrl: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path="/attivita" element={children} />
      </Routes>
    </MemoryRouter>
  );
}

describe("useAttivitaFilters", () => {
  it("defaults to empty strings and no filters", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita"),
    });
    expect(result.current.from).toBe("");
    expect(result.current.to).toBe("");
    expect(result.current.aziendaId).toBe("");
    expect(result.current.tipoId).toBe("");
    expect(result.current.vetUid).toBe("");
    expect(result.current.group).toBe("none");
    expect(result.current.filters).toEqual({});
  });

  it("parses from/to/azienda/tipo from URL", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl(
        "/attivita?from=2026-01-01&to=2026-01-31&azienda=az1&tipo=t1"
      ),
    });
    expect(result.current.from).toBe("2026-01-01");
    expect(result.current.to).toBe("2026-01-31");
    expect(result.current.aziendaId).toBe("az1");
    expect(result.current.tipoId).toBe("t1");
    expect(result.current.filters.aziendaId).toBe("az1");
    expect(result.current.filters.tipoId).toBe("t1");
    expect(result.current.filters.from).toBeInstanceOf(Date);
    expect(result.current.filters.to).toBeInstanceOf(Date);
  });

  it("pushes to end-of-day for the to filter", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita?to=2026-01-31"),
    });
    const end = result.current.filters.to;
    expect(end).toBeInstanceOf(Date);
    expect(end?.getHours()).toBe(23);
    expect(end?.getMinutes()).toBe(59);
    expect(end?.getSeconds()).toBe(59);
  });

  it("parses the group key with a safe fallback", () => {
    const cases: Array<{ url: string; expected: string }> = [
      { url: "/attivita?group=azienda", expected: "azienda" },
      { url: "/attivita?group=giorno", expected: "giorno" },
      { url: "/attivita?group=vet", expected: "vet" },
      { url: "/attivita?group=garbage", expected: "none" },
      { url: "/attivita", expected: "none" },
    ];
    for (const c of cases) {
      const { result } = renderHook(() => useAttivitaFilters(), {
        wrapper: wrapperWithUrl(c.url),
      });
      expect(result.current.group).toBe(c.expected);
    }
  });

  it("sets ownerUid when vet param is present", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita?vet=u-42"),
    });
    expect(result.current.vetUid).toBe("u-42");
    expect(result.current.filters.ownerUid).toBe("u-42");
  });

  it("omits ownerUid when vet param is absent", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita"),
    });
    expect(result.current.vetUid).toBe("");
    expect(result.current.filters.ownerUid).toBeUndefined();
  });

  it("setParam writes a value into the URL", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita"),
    });
    act(() => result.current.setParam("azienda", "az9"));
    expect(result.current.aziendaId).toBe("az9");
    expect(result.current.filters.aziendaId).toBe("az9");
  });

  it("setParam removes a key when given an empty string", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita?azienda=az1"),
    });
    act(() => result.current.setParam("azienda", ""));
    expect(result.current.aziendaId).toBe("");
    expect(result.current.filters.aziendaId).toBeUndefined();
  });

  it("ignores malformed date strings", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita?from=bad&to=also-bad"),
    });
    expect(result.current.filters.from).toBeUndefined();
    expect(result.current.filters.to).toBeUndefined();
  });

  it("setRange writes from and to in a single update", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl("/attivita"),
    });
    act(() => result.current.setRange("2026-03-01", "2026-03-31"));
    expect(result.current.from).toBe("2026-03-01");
    expect(result.current.to).toBe("2026-03-31");
  });

  it("clearAll removes every filter key in one URL update", () => {
    const { result } = renderHook(() => useAttivitaFilters(), {
      wrapper: wrapperWithUrl(
        "/attivita?from=2026-01-01&to=2026-01-31&azienda=az1&tipo=t1&vet=u-1&group=azienda"
      ),
    });
    act(() => result.current.clearAll());
    expect(result.current.from).toBe("");
    expect(result.current.to).toBe("");
    expect(result.current.aziendaId).toBe("");
    expect(result.current.tipoId).toBe("");
    expect(result.current.vetUid).toBe("");
    expect(result.current.group).toBe("none");
    expect(result.current.filters).toEqual({});
  });
});
