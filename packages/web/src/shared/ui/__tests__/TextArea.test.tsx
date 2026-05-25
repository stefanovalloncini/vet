import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextArea } from "../TextArea";

describe("TextArea", () => {
  it("renders a textarea with the label associated", () => {
    render(<TextArea id="note" label="Note" />);
    const input = screen.getByLabelText(/Note/i);
    expect(input.tagName).toBe("TEXTAREA");
  });

  it("fires onChange when typing", () => {
    const onChange = vi.fn();
    render(<TextArea id="x" label="X" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/X/i), {
      target: { value: "ciao" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("shows hint when no error", () => {
    render(<TextArea id="x" label="X" hint="max 500 caratteri" />);
    expect(screen.getByText(/max 500 caratteri/i)).toBeInTheDocument();
  });

  it("shows error with role='alert' instead of hint", () => {
    render(
      <TextArea id="x" label="X" hint="hint testo" error="campo obbligatorio" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/campo obbligatorio/i);
    expect(screen.queryByText(/hint testo/i)).toBeNull();
  });

  it("forwards a ref to the underlying textarea", () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<TextArea ref={ref} id="x" label="X" />);
    expect(ref.current?.tagName).toBe("TEXTAREA");
  });

  it("forwards native attributes like rows and maxLength", () => {
    render(<TextArea id="x" label="X" rows={5} maxLength={100} />);
    const ta = screen.getByLabelText(/X/i) as HTMLTextAreaElement;
    expect(ta.rows).toBe(5);
    expect(ta.maxLength).toBe(100);
  });
});
