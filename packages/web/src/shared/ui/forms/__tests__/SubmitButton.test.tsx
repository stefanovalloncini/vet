import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Form } from "../Form";
import { Field } from "../Field";
import { SubmitButton } from "../SubmitButton";

const schema = z.object({ name: z.string().min(1) });

describe("SubmitButton", () => {
  it("is disabled when pristine and disableWhenPristine=true (default)", () => {
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ name: "" }}
        onSubmit={() => {}}
      >
        <Field kind="text" name="name" label="Nome" />
        <SubmitButton>Salva</SubmitButton>
      </Form>,
    );
    const btn = screen.getByRole("button", { name: "Salva" });
    expect(btn).toBeDisabled();
  });

  it("becomes enabled once a field is edited (dirty)", () => {
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ name: "" }}
        onSubmit={() => {}}
      >
        <Field kind="text" name="name" label="Nome" />
        <SubmitButton>Salva</SubmitButton>
      </Form>,
    );
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "X" },
    });
    const btn = screen.getByRole("button", { name: "Salva" });
    expect(btn).not.toBeDisabled();
  });

  it("disables while submitting and shows the spinner", async () => {
    let release: () => void = () => {};
    const blocking = new Promise<void>((r) => {
      release = r;
    });
    render(
      <Form<typeof schema>
        schema={schema}
        defaultValues={{ name: "Mario" }}
        onSubmit={async () => {
          await blocking;
        }}
      >
        <Field kind="text" name="name" label="Nome" />
        <SubmitButton disableWhenPristine={false}>Salva</SubmitButton>
      </Form>,
    );
    const btn = screen.getByRole("button", { name: /Salva/ });
    fireEvent.click(btn);
    // After click, submission is pending — button should disable and Spinner role=status appears.
    await screen.findByRole("status");
    expect(btn).toBeDisabled();
    release();
  });
});
