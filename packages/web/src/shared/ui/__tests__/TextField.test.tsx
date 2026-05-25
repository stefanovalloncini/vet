import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "../TextField";

describe("TextField", () => {
  it("renders label tied to input via htmlFor", () => {
    render(<TextField id="email" label="Email" />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.id).toBe("email");
  });

  it("forwards value and onChange", () => {
    const onChange = vi.fn();
    render(<TextField id="x" label="X" value="abc" onChange={onChange} />);
    const input = screen.getByLabelText("X") as HTMLInputElement;
    expect(input.value).toBe("abc");
    fireEvent.change(input, { target: { value: "abcd" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders error with role=alert", () => {
    render(<TextField id="x" label="X" error="Campo obbligatorio" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Campo obbligatorio");
  });

  it("renders hint when no error", () => {
    render(<TextField id="x" label="X" hint="Indicazione" />);
    expect(screen.getByText("Indicazione")).toBeInTheDocument();
  });

  it("prefers error over hint when both passed", () => {
    render(<TextField id="x" label="X" error="errore" hint="hint" />);
    expect(screen.getByRole("alert")).toHaveTextContent("errore");
    expect(screen.queryByText("hint")).toBeNull();
  });

  it("applies 44px touch height", () => {
    render(<TextField id="x" label="X" />);
    expect((screen.getByLabelText("X") as HTMLInputElement).className).toContain("h-11");
  });

  it("supports type='date'", () => {
    render(<TextField id="d" label="D" type="date" defaultValue="2026-05-25" />);
    expect((screen.getByLabelText("D") as HTMLInputElement).type).toBe("date");
  });
});
