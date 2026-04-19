import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renders the trigger child", () => {
    render(
      <Tooltip content="도움말">
        <button>도움</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "도움" })).toBeInTheDocument();
  });

  it("is hidden by default", () => {
    render(
      <Tooltip content="hidden-content">
        <button>t</button>
      </Tooltip>,
    );
    expect(screen.queryByText("hidden-content")).not.toBeInTheDocument();
  });

  it("shows on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="hover-content">
        <button>trigger</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button"));
    expect(await screen.findByText("hover-content")).toBeInTheDocument();
  });

  it("hides on unhover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="c">
        <button>t</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    await user.hover(trigger);
    expect(await screen.findByText("c")).toBeInTheDocument();
    await user.unhover(trigger);
    expect(screen.queryByText("c")).not.toBeInTheDocument();
  });

  it("shows on keyboard focus (accessibility requirement)", () => {
    render(
      <Tooltip content="focus-content">
        <button>t</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    act(() => {
      trigger.focus();
    });
    expect(screen.getByText("focus-content")).toBeInTheDocument();
  });

  it("hides on blur", () => {
    render(
      <Tooltip content="c">
        <button>t</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    act(() => {
      trigger.focus();
    });
    expect(screen.getByText("c")).toBeInTheDocument();
    act(() => {
      trigger.blur();
    });
    expect(screen.queryByText("c")).not.toBeInTheDocument();
  });

  it("renders with tooltip role and descriptive id linked via aria-describedby", () => {
    render(
      <Tooltip content="아이디 연결">
        <button>x</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button");
    act(() => {
      trigger.focus();
    });
    const tooltip = screen.getByRole("tooltip");
    const id = tooltip.getAttribute("id");
    expect(id).toBeTruthy();
    expect(trigger).toHaveAttribute("aria-describedby", id!);
  });

  it("applies CSS variable tokens for styling", () => {
    render(
      <Tooltip content="styled">
        <button>t</button>
      </Tooltip>,
    );
    act(() => {
      screen.getByRole("button").focus();
    });
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.style.background).toContain("var(--popover)");
    expect(tooltip.style.borderRadius).toContain("var(--radius-md)");
  });
});
