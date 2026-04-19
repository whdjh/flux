import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "./icon";

describe("Icon", () => {
  it("renders an svg element", () => {
    const { container } = render(
      <Icon>
        <path d="M0 0h10v10H0z" />
      </Icon>,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("is aria-hidden by default when no label provided", () => {
    const { container } = render(
      <Icon>
        <path d="M0 0h10v10H0z" />
      </Icon>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
  });

  it("becomes img role when aria-label provided", () => {
    const { container } = render(
      <Icon aria-label="close">
        <path d="M0 0h10v10H0z" />
      </Icon>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("close");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
  });

  it.each([
    ["sm", "var(--icon-sm)"],
    ["md", "var(--icon-md)"],
    ["lg", "var(--icon-lg)"],
  ] as const)("applies %s size using CSS variable token", (size, token) => {
    const { container } = render(
      <Icon size={size}>
        <path d="M0 0h10v10H0z" />
      </Icon>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.style.width).toContain(token);
    expect(svg.style.height).toContain(token);
  });

  it("defaults size to md", () => {
    const { container } = render(
      <Icon>
        <path d="M0 0h10v10H0z" />
      </Icon>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.style.width).toContain("var(--icon-md)");
  });

  it("accepts custom viewBox", () => {
    const { container } = render(
      <Icon viewBox="0 0 48 48">
        <path d="M0 0h48v48H0z" />
      </Icon>,
    );
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe(
      "0 0 48 48",
    );
  });

  it("uses currentColor fill for theming via CSS", () => {
    const { container } = render(
      <Icon>
        <path d="M0 0h10v10H0z" />
      </Icon>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("fill")).toBe("currentColor");
  });
});
