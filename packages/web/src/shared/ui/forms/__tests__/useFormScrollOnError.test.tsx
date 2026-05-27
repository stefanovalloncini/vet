import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Form } from "../Form";
import { Field } from "../Field";
import { SubmitButton } from "../SubmitButton";

const schema = z.object({
  email: z.string().email(),
  nome: z.string().min(1),
});

describe("useFormScrollOnError (via Form)", () => {
  beforeEach(() => {
    // jsdom doesn't implement scrollIntoView; stub it on the prototype.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("focuses and scrolls the first invalid input on submit failure", async () => {
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ email: "", nome: "" }}
        onSubmit={() => {}}
      >
        <Field kind="text" name="email" label="Email" type="email" />
        <Field kind="text" name="nome" label="Nome" />
        <SubmitButton disableWhenPristine={false}>Salva</SubmitButton>
      </Form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    // Wait for the validation error to render under the email field — at that
    // point react-hook-form has finished the resolver run and our onInvalid
    // callback has fired.
    await screen.findByText("Email non valida");
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    expect(document.activeElement).toBe(emailInput);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
