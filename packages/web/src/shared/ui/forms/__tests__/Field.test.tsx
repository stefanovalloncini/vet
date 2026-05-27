import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Form } from "../Form";
import { Field } from "../Field";

const schema = z.object({
  txt: z.string().optional(),
  num: z.number().optional(),
  sel: z.string().optional(),
  area: z.string().optional(),
  seg: z.string().optional(),
  sw: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

const SELECT_OPTIONS = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

function Harness() {
  const defaults: Values = {
    txt: "",
    num: undefined,
    sel: "a",
    area: "",
    seg: "a",
    sw: false,
  };
  return (
    <Form<typeof schema>
      schema={schema}
      defaultValues={defaults}
      onSubmit={() => {}}
    >
      <Field kind="text" name="txt" label="Testo" />
      <Field kind="number" name="num" label="Numero" />
      <Field kind="select" name="sel" label="Selezione" options={SELECT_OPTIONS} />
      <Field kind="textarea" name="area" label="Note" />
      <Field kind="segmented" name="seg" label="Segmenti" options={SELECT_OPTIONS} />
      <Field kind="switch" name="sw" label="Interruttore" />
    </Form>
  );
}

describe("Field", () => {
  it("renders text → <input type=text>", () => {
    render(<Harness />);
    const el = screen.getByLabelText("Testo") as HTMLInputElement;
    expect(el.tagName).toBe("INPUT");
    expect(el.type).toBe("text");
  });

  it("renders number → <input type=number>", () => {
    render(<Harness />);
    const el = screen.getByLabelText("Numero") as HTMLInputElement;
    expect(el.tagName).toBe("INPUT");
    expect(el.type).toBe("number");
  });

  it("renders select → <select>", () => {
    render(<Harness />);
    const el = screen.getByLabelText("Selezione") as HTMLSelectElement;
    expect(el.tagName).toBe("SELECT");
    expect(el.options.length).toBe(2);
  });

  it("renders textarea → <textarea>", () => {
    render(<Harness />);
    const el = screen.getByLabelText("Note");
    expect(el.tagName).toBe("TEXTAREA");
  });

  it("renders segmented → radiogroup with role=radio buttons", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: "Segmenti" });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThanOrEqual(2);
  });

  it("renders switch → checkbox input", () => {
    render(<Harness />);
    const cb = screen.getByLabelText("Interruttore", { selector: "input" }) as HTMLInputElement;
    expect(cb.type).toBe("checkbox");
  });
});
