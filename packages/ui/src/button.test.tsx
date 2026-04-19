import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies primary variant styles via CSS variables", () => {
    render(<Button variant="primary">P</Button>);
    const button = screen.getByRole("button");
    expect(button.style.background).toContain("var(--primary)");
    expect(button.style.color).toContain("var(--primary-foreground)");
  });

  it.each([
    ["primary" as const],
    ["secondary" as const],
    ["destructive" as const],
    ["ghost" as const],
  ])("renders %s variant with data-variant attribute", (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", variant);
  });

  it.each([
    ["sm" as const],
    ["md" as const],
    ["lg" as const],
  ])("renders %s size with data-size attribute", (size) => {
    render(<Button size={size}>x</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-size", size);
  });

  it("defaults to primary/md when no variant/size given", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
  });

  it("is disabled and does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports keyboard activation (Enter / Space)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Key</Button>);
    const button = screen.getByRole("button");
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("forwards aria-label for icon-only buttons", () => {
    render(<Button aria-label="삭제">x</Button>);
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("forwards type prop (defaults to button)", () => {
    render(<Button>Default type</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("forwards custom type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("merges className with internal class", () => {
    render(<Button className="extra">x</Button>);
    expect(screen.getByRole("button").className).toContain("extra");
  });
});
