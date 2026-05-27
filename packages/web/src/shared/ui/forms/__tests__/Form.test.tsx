import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Form } from "../Form";
import { Field } from "../Field";
import { SubmitButton } from "../SubmitButton";

const schema = z.object({
  email: z.string().email(),
  nome: z.string().min(1),
});
type Values = z.infer<typeof schema>;

describe("Form", () => {
  it("calls onSubmit with parsed values when valid", async () => {
    const onSubmit = vi.fn();
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ email: "", nome: "" }}
        onSubmit={onSubmit}
      >
        <Field kind="text" name="email" label="Email" type="email" />
        <Field kind="text" name="nome" label="Nome" />
        <SubmitButton disableWhenPristine={false}>Salva</SubmitButton>
      </Form>,
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "vet@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Mario" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const callArgs = onSubmit.mock.calls[0]![0] as Values;
    expect(callArgs).toEqual({ email: "vet@example.com", nome: "Mario" });
  });

  it("does NOT call onSubmit on invalid input and renders errors", async () => {
    const onSubmit = vi.fn();
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ email: "", nome: "" }}
        onSubmit={onSubmit}
      >
        <Field kind="text" name="email" label="Email" type="email" />
        <Field kind="text" name="nome" label="Nome" />
        <SubmitButton disableWhenPristine={false}>Salva</SubmitButton>
      </Form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    expect(await screen.findByText("Email non valida")).toBeInTheDocument();
    expect(screen.getByText("Campo obbligatorio")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports the render-prop child for accessing methods", async () => {
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ email: "", nome: "" }}
        onSubmit={() => {}}
      >
        {(methods) => (
          <>
            <Field kind="text" name="email" label="Email" />
            <span data-testid="dirty">
              {methods.formState.isDirty ? "dirty" : "pristine"}
            </span>
          </>
        )}
      </Form>,
    );
    expect(screen.getByTestId("dirty")).toHaveTextContent("pristine");
  });
});
