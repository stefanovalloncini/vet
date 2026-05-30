import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityTypeForm } from "../ActivityTypeForm";

describe("ActivityTypeForm", () => {
  it("renders the initial tariffa as a string and hides Salva until dirty", () => {
    render(
      <ActivityTypeForm
        id="visita"
        initial={80}
        busy={false}
        onSubmit={vi.fn()}
      />
    );
    const input = screen.getByLabelText(/Tariffa standard/i) as HTMLInputElement;
    expect(input.value).toBe("80");
    expect(screen.queryByRole("button", { name: /Salva/i })).toBeNull();
  });

  it("shows Salva once the value changes and submits the typed value", async () => {
    const onSubmit = vi.fn();
    render(
      <ActivityTypeForm
        id="visita"
        initial={80}
        busy={false}
        onSubmit={onSubmit}
      />
    );
    const input = screen.getByLabelText(/Tariffa standard/i);
    fireEvent.change(input, { target: { value: "95" } });
    const save = screen.getByRole("button", { name: /Salva/i });
    fireEvent.click(save);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("95"));
  });

  it("rejects negative numbers with a field-level error", async () => {
    const onSubmit = vi.fn();
    render(
      <ActivityTypeForm
        id="visita"
        initial={undefined}
        busy={false}
        onSubmit={onSubmit}
      />
    );
    const input = screen.getByLabelText(/Tariffa standard/i);
    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    expect(await screen.findByText(/Tariffa non valida/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("uses an input id derived from the tipo id", () => {
    render(
      <ActivityTypeForm
        id="ecografia"
        initial={50}
        busy={false}
        onSubmit={vi.fn()}
      />
    );
    const input = document.getElementById("ecografia-tariffa");
    expect(input).not.toBeNull();
    expect((input as HTMLInputElement).value).toBe("50");
  });

  it("disables the input while busy", () => {
    render(
      <ActivityTypeForm
        id="visita"
        initial={80}
        busy
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/Tariffa standard/i)).toBeDisabled();
  });

  it("allows clearing the tariffa to an empty string", async () => {
    const onSubmit = vi.fn();
    render(
      <ActivityTypeForm
        id="visita"
        initial={80}
        busy={false}
        onSubmit={onSubmit}
      />
    );
    const input = screen.getByLabelText(/Tariffa standard/i);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Salva/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(""));
  });

  it("steps the tariffa by 10 on ArrowUp and keeps cents typeable", () => {
    render(
      <ActivityTypeForm
        id="visita"
        initial={50}
        busy={false}
        onSubmit={vi.fn()}
      />
    );
    const input = screen.getByLabelText(/Tariffa standard/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "19.99" } });
    expect(input.validity.stepMismatch).toBe(false);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("30");
    fireEvent.change(input, { target: { value: "60" } });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("70");
  });
});
