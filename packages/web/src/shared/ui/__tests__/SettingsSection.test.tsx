import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsSection } from "../SettingsSection";

describe("SettingsSection", () => {
  it("renders the title as an h2", () => {
    render(
      <SettingsSection title="Account">
        <p>row</p>
      </SettingsSection>
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /Account/i })
    ).toBeInTheDocument();
  });

  it("renders all children inside the divided container", () => {
    render(
      <SettingsSection title="X">
        <p>uno</p>
        <p>due</p>
      </SettingsSection>
    );
    expect(screen.getByText(/uno/i)).toBeInTheDocument();
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it("uses a section landmark for the wrapper", () => {
    const { container } = render(
      <SettingsSection title="X">
        <p>row</p>
      </SettingsSection>
    );
    expect(container.querySelector("section")).not.toBeNull();
  });
});
