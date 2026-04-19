import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input", () => {
  it("renders with label associated to input (htmlFor)", () => {
    render(<Input label="이름" name="username" />);
    const input = screen.getByLabelText("이름");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("renders placeholder", () => {
    render(<Input label="검색" placeholder="키워드 입력" />);
    expect(screen.getByPlaceholderText("키워드 입력")).toBeInTheDocument();
  });

  it("accepts typing input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="이름" onChange={onChange} />);
    const input = screen.getByLabelText("이름") as HTMLInputElement;
    await user.type(input, "abc");
    expect(input.value).toBe("abc");
    expect(onChange).toHaveBeenCalled();
  });

  it("shows error message and marks input aria-invalid", () => {
    render(<Input label="이메일" error="올바른 이메일을 입력하세요" />);
    const input = screen.getByLabelText("이메일");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("올바른 이메일을 입력하세요")).toBeInTheDocument();
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
  });

  it("does not mark aria-invalid when no error", () => {
    render(<Input label="이름" />);
    const input = screen.getByLabelText("이름");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("supports disabled state", () => {
    render(<Input label="x" disabled />);
    expect(screen.getByLabelText("x")).toBeDisabled();
  });

  it("uses CSS variable tokens for height/border", () => {
    render(<Input label="token" />);
    const input = screen.getByLabelText("token");
    expect(input.style.height).toContain("var(--input-height)");
    expect(input.style.border).toContain("var(--border)");
  });

  it("supports keyboard focus", () => {
    render(<Input label="focus" />);
    const input = screen.getByLabelText("focus");
    input.focus();
    expect(input).toHaveFocus();
  });

  it("renders without label by using aria-label fallback", () => {
    render(<Input aria-label="검색" />);
    expect(screen.getByLabelText("검색")).toBeInTheDocument();
  });
});
