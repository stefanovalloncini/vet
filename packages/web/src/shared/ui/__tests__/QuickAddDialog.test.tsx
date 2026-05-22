import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickAddDialog, type QuickAddSchema } from "../QuickAddDialog";
import { TextField } from "../TextField";

interface Values {
  nome: string;
}

interface Entity {
  id: string;
  nome: string;
}

const schema: QuickAddSchema<Values> = {
  safeParse(input: unknown) {
    const v = input as Values;
    const nome = (v?.nome ?? "").trim();
    if (!nome) {
      return {
        success: false,
        error: { issues: [{ path: ["nome"], message: "Nome obbligatorio" }] },
      };
    }
    return { success: true, data: { nome } };
  },
};

interface HarnessProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (e: Entity) => void;
  submit: (v: Values) => Promise<Entity>;
}

function Harness({ open, onClose, onCreated, submit }: HarnessProps) {
  return (
    <QuickAddDialog<Entity, Values>
      open={open}
      onClose={onClose}
      title="Nuovo elemento"
      description="Descrizione di prova"
      schema={schema}
      initialValues={{ nome: "" }}
      submit={submit}
      {...(onCreated ? { onCreated } : {})}
      canSubmit={(v) => v.nome.trim().length > 0}
    >
      {({ values, setField, errors, busy }) => (
        <TextField
          id="qa-nome"
          label="Nome"
          value={values.nome}
          onChange={(e) => setField("nome", e.target.value)}
          disabled={busy}
          error={errors.nome}
        />
      )}
    </QuickAddDialog>
  );
}

describe("QuickAddDialog", () => {
  it("renders title and description, disables submit until valid", () => {
    render(
      <Harness
        open
        onClose={() => {}}
        submit={async () => ({ id: "x", nome: "x" })}
      />
    );
    expect(screen.getByText("Nuovo elemento")).toBeInTheDocument();
    expect(screen.getByText("Descrizione di prova")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crea" })).toBeDisabled();
  });

  it("calls submit and onCreated on success, then closes", async () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const submit = vi.fn(async (v: Values) => ({ id: "new", nome: v.nome }));
    render(<Harness open onClose={onClose} onCreated={onCreated} submit={submit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Mario" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));

    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith({ nome: "Mario" });
    });
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith({ id: "new", nome: "Mario" });
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("surfaces submit error and keeps dialog open", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const submit = vi.fn(async () => {
      throw new Error("Boom");
    });
    render(<Harness open onClose={onClose} onCreated={onCreated} submit={submit} />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Anna" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Boom");
    });
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("shows schema validation error without calling submit", async () => {
    const submit = vi.fn();
    render(
      <Harness
        open
        onClose={() => {}}
        submit={submit as unknown as (v: Values) => Promise<Entity>}
      />
    );
    const input = screen.getByLabelText("Nome");
    fireEvent.change(input, { target: { value: "ok" } });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.some((a) => a.textContent === "Nome obbligatorio")).toBe(true);
    });
    expect(submit).not.toHaveBeenCalled();
  });
});
