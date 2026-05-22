import { useCallback, useEffect, useState } from "react";
import { NAV_SECTIONS, sectionContainsPath } from "./SidebarConfig";

const SECTIONS_STORAGE_KEY = "vet.sidebarSectionsCollapsed";

function readCollapsedSections(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage?.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

export interface UseSidebarSectionsResult {
  collapsedSections: ReadonlySet<string>;
  toggleSection: (title: string) => void;
}

export function useSidebarSections(
  pathname: string,
  caps?: ReadonlySet<string>
): UseSidebarSectionsResult {
  const [collapsedSections, setCollapsedSections] = useState<ReadonlySet<string>>(
    readCollapsedSections
  );

  useEffect(() => {
    const containing = NAV_SECTIONS.find((s) =>
      sectionContainsPath(s, pathname, caps)
    );
    if (!containing) return;
    setCollapsedSections((prev) => {
      if (!prev.has(containing.title)) return prev;
      const next = new Set(prev);
      next.delete(containing.title);
      return next;
    });
  }, [pathname, caps]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(
        SECTIONS_STORAGE_KEY,
        JSON.stringify([...collapsedSections])
      );
    } catch {
      // ignore (e.g. jsdom test env without storage)
    }
  }, [collapsedSections]);

  const toggleSection = useCallback((title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  return { collapsedSections, toggleSection };
}
