import { useState } from "react";
import { SectionLabel } from "../../../shared/ui";

interface TagsEditorProps {
  tags: ReadonlyArray<string>;
  onChange: (next: string[]) => void;
}

export function TagsEditor({ tags, onChange }: TagsEditorProps) {
  const [input, setInput] = useState("");

  function commitInput() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...tags, trimmed]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitInput();
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div>
      <SectionLabel className="mb-2">Etichette</SectionLabel>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-(--color-accent-soft) text-(--color-text)"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-(--color-text-subtle) hover:text-(--color-danger)"
              aria-label="Rimuovi etichetta"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Aggiungi etichetta…" : ""}
          className="text-xs bg-transparent text-(--color-text) focus:outline-none placeholder:text-(--color-text-subtle) min-w-[8ch]"
        />
      </div>
    </div>
  );
}
