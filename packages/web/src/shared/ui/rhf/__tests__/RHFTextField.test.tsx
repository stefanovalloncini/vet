import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFTextField } from "../RHFTextField";

const schema = z.object({
  email: z.string().email("Email non valida"),
});

type FormValues = z.infer<typeof schema>;

function Harness({
  onSubmit = () => {},
}: {
  onSubmit?: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <RHFTextField<FormValues> name="email" label="Email" type="email" />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

describe("RHFTextField", () => {
  it("reflects field value as user types", () => {
    render(<Harness />);
    const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "vet@example.com" } });
    expect(input.value).toBe("vet@example.com");
  });

  it("surfaces field-level validation error from the schema on submit", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
    expect(await screen.findByText(/Email non valida/i)).toBeInTheDocument();
  });

  it("calls onSubmit with parsed values when valid", () => {
    let captured: FormValues | null = null;
    render(<Harness onSubmit={(v) => { captured = v; }} />);
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "vet@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(captured).toEqual({ email: "vet@example.com" });
        resolve();
      }, 30)
    );
  });
});
