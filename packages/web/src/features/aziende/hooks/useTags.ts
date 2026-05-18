import { useEffect, useState } from "react";

const STORAGE_KEY = "vet.aziendeTags";

interface TagMap {
  [aziendaId: string]: string[];
}

function read(): TagMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as TagMap;
  } catch {
    // ignore
  }
  return {};
}

function write(map: TagMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function useTags() {
  const [tags, setTags] = useState<TagMap>(read);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setTags(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function setForAzienda(id: string, list: string[]) {
    setTags((prev) => {
      const next = { ...prev };
      const cleaned = [...new Set(list.map((t) => t.trim()).filter(Boolean))];
      if (cleaned.length === 0) delete next[id];
      else next[id] = cleaned;
      write(next);
      return next;
    });
  }

  function allTags(): string[] {
    const set = new Set<string>();
    for (const list of Object.values(tags)) for (const t of list) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b, "it"));
  }

  function tagsFor(id: string): string[] {
    return tags[id] ?? [];
  }

  return { tags, tagsFor, allTags, setForAzienda };
}
