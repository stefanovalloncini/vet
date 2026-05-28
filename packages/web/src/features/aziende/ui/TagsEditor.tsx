import { useState } from "react";
import { X } from "lucide-react";

interface TagsEditorProps {
  tags: ReadonlyArray<string>;
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function TagsEditor({ tags, onChange, disabled = false }: TagsEditorProps) {
  const [input, setInput] = useState("");

  function commitInput() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...tags, trimmed]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitInput();
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div>
      <label
        htmlFor="tags-input"
        className="mb-2 block text-xs uppercase tracking-wider text-(--color-text-muted)"
      >
        Etichette
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-(--color-accent-soft) py-0.5 pl-2 pr-1 text-xs text-(--color-text)"
          >
            <span className="min-w-0 break-words">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-(--color-text-subtle) transition-colors hover:text-(--color-danger) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) disabled:opacity-50"
              aria-label={`Rimuovi etichetta ${tag}`}
            >
              <X size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id="tags-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={tags.length === 0 ? "Aggiungi etichetta…" : ""}
          className="min-w-[8ch] flex-1 bg-transparent py-1 text-xs text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}
