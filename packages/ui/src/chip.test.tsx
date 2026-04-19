import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders label", () => {
    render(<Chip>keyword</Chip>);
    expect(screen.getByText("keyword")).toBeInTheDocument();
  });

  it.each([
    ["neutral" as const],
    ["info" as const],
    ["success" as const],
    ["warning" as const],
    ["destructive" as const],
  ])("renders %s tone via data-tone attribute", (tone) => {
    render(<Chip tone={tone}>x</Chip>);
    const chip = screen.getByText("x");
    expect(chip).toHaveAttribute("data-tone", tone);
  });

  it("uses chip-height CSS variable token", () => {
    render(<Chip>t</Chip>);
    const chip = screen.getByText("t");
    expect(chip.style.height).toContain("var(--chip-height)");
  });

  it("renders removable chip with accessible remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeAriaLabel="제거">
        tag
      </Chip>,
    );
    const removeButton = screen.getByRole("button", { name: "제거" });
    await user.click(removeButton);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("omits remove button when onRemove is not provided", () => {
    render(<Chip>t</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("supports keyboard activation on remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeAriaLabel="제거">
        k
      </Chip>,
    );
    const button = screen.getByRole("button", { name: "제거" });
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalled();
  });

  it("defaults tone to neutral when unspecified", () => {
    render(<Chip>d</Chip>);
    expect(screen.getByText("d")).toHaveAttribute("data-tone", "neutral");
  });
});
