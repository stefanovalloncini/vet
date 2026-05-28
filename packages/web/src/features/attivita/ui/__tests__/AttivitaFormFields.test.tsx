import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AttivitaFormFields } from "../AttivitaFormFields";
import { emptyFormValues, type AttivitaFormValues } from "../../lib/formSchema";

function Harness({ children }: { children: ReactNode }) {
  const form = useForm<AttivitaFormValues>({
    defaultValues: emptyFormValues(),
  });
  return <FormProvider {...form}>{children}</FormProvider>;
}

const baseProps = {
  busy: false,
  isEdit: false,
  tariffaSuggested: false,
  totaleLive: null,
  aziendaOptions: [
    { value: "", label: "Scegli azienda" },
    { value: "az1", label: "Cascina" },
  ],
  tipoOptions: [
    { value: "", label: "Scegli tipo" },
    { value: "t1", label: "Visita" },
  ],
};

describe("AttivitaFormFields", () => {
  it("allows a tariffa minimum of zero (regression: no 'minimo 1000' floor)", () => {
    render(
      <Harness>
        <AttivitaFormFields {...baseProps} />
      </Harness>
    );
    const tariffa = screen.getByLabelText(/Tariffa/i) as HTMLInputElement;
    expect(tariffa).toHaveAttribute("min", "0");
    expect(tariffa).toHaveAttribute("max", "100000");
  });

  it("labels the two rate-mode toggles", () => {
    render(
      <Harness>
        <AttivitaFormFields {...baseProps} />
      </Harness>
    );
    expect(screen.getByLabelText("Pagamento orario")).toBeInTheDocument();
    expect(screen.getByLabelText("Pagamento ad elemento")).toBeInTheDocument();
  });

  it("reveals the ore field only when oraria is checked", () => {
    render(
      <Harness>
        <AttivitaFormFields {...baseProps} />
      </Harness>
    );
    expect(screen.queryByLabelText("Ore")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Pagamento orario"));
    expect(screen.getByLabelText("Ore")).toBeInTheDocument();
  });

  it("renders the live total with an Italian decimal comma", () => {
    render(
      <Harness>
        <AttivitaFormFields {...baseProps} totaleLive={1234.5} />
      </Harness>
    );
    expect(screen.getByText(/234,50/)).toBeInTheDocument();
  });

  it("hides the reminder block in edit mode", () => {
    const { rerender } = render(
      <Harness>
        <AttivitaFormFields {...baseProps} isEdit={false} />
      </Harness>
    );
    expect(screen.getByLabelText("Titolo promemoria")).toBeInTheDocument();
    rerender(
      <Harness>
        <AttivitaFormFields {...baseProps} isEdit />
      </Harness>
    );
    expect(screen.queryByLabelText("Titolo promemoria")).not.toBeInTheDocument();
  });
});
