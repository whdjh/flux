import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SplitView } from "./split-view";

describe("SplitView", () => {
  it("renders both panes", () => {
    render(
      <SplitView left={<div>left-pane</div>} right={<div>right-pane</div>} />,
    );
    expect(screen.getByText("left-pane")).toBeInTheDocument();
    expect(screen.getByText("right-pane")).toBeInTheDocument();
  });

  it("renders a separator with role=separator for a11y", () => {
    render(<SplitView left={<div>l</div>} right={<div>r</div>} />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("uses aria-valuenow reflecting the current left ratio", () => {
    render(
      <SplitView left={<div>l</div>} right={<div>r</div>} defaultRatio={0.5} />,
    );
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-valuenow", "50");
  });

  it.each([
    [0.5, "50"],
    [1 / 3, "33"],
    [0.25, "25"],
  ])("supports preset ratios (%f)", (ratio, expected) => {
    render(
      <SplitView
        left={<div>l</div>}
        right={<div>r</div>}
        defaultRatio={ratio}
      />,
    );
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-valuenow", expected);
  });

  it("clamps ratio to minRatio / maxRatio", () => {
    render(
      <SplitView
        left={<div>l</div>}
        right={<div>r</div>}
        defaultRatio={0.05}
        minRatio={0.1}
        maxRatio={0.9}
      />,
    );
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-valuenow", "10");
  });

  it("adjusts ratio via keyboard arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <SplitView left={<div>l</div>} right={<div>r</div>} defaultRatio={0.5} />,
    );
    const sep = screen.getByRole("separator");
    sep.focus();
    expect(sep).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    const now = Number(sep.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThan(50);
  });

  it("decreases ratio on ArrowLeft", async () => {
    const user = userEvent.setup();
    render(
      <SplitView left={<div>l</div>} right={<div>r</div>} defaultRatio={0.5} />,
    );
    const sep = screen.getByRole("separator");
    sep.focus();
    await user.keyboard("{ArrowLeft}");
    const now = Number(sep.getAttribute("aria-valuenow"));
    expect(now).toBeLessThan(50);
  });

  it("applies grid-template style with fr units derived from ratio", () => {
    const { container } = render(
      <SplitView left={<div>l</div>} right={<div>r</div>} defaultRatio={0.5} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.display).toBe("grid");
    expect(root.style.gridTemplateColumns).toContain("fr");
  });

  it("starts drag on pointer down and updates ratio on move", () => {
    const { container } = render(
      <SplitView left={<div>l</div>} right={<div>r</div>} defaultRatio={0.5} />,
    );
    const root = container.firstChild as HTMLElement;
    // jsdom doesn't layout, so mock getBoundingClientRect for deterministic math.
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 500,
      width: 1000,
      height: 500,
      toJSON: () => "",
    } as DOMRect);
    const sep = screen.getByRole("separator");
    fireEvent.pointerDown(sep, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 700, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 700, pointerId: 1 });
    // Ratio should have shifted right (> 50%).
    const now = Number(sep.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThan(50);
  });
});
