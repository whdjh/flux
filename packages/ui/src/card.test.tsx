import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "./card";

describe("Card", () => {
  it("renders title and meta", () => {
    render(<Card title="문서 제목" meta="2025-04-19" />);
    expect(screen.getByText("문서 제목")).toBeInTheDocument();
    expect(screen.getByText("2025-04-19")).toBeInTheDocument();
  });

  it("renders thumbnail image with alt text", () => {
    render(
      <Card
        title="With image"
        meta="meta"
        thumbnailSrc="/img.png"
        thumbnailAlt="썸네일"
      />,
    );
    const img = screen.getByRole("img", { name: "썸네일" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/img.png");
  });

  it("renders without thumbnail when src missing", () => {
    render(<Card title="No image" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uses CSS variable tokens for padding/radius", () => {
    const { container } = render(<Card title="token" />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.padding).toContain("var(--card-padding)");
    expect(root.style.borderRadius).toContain("var(--card-radius)");
  });

  it("behaves as button role when onClick is passed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card title="clickable" onClick={onClick} />);
    const card = screen.getByRole("button", { name: /clickable/ });
    await user.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("activates via keyboard (Enter / Space) when clickable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card title="keyboard" onClick={onClick} />);
    const card = screen.getByRole("button");
    card.focus();
    expect(card).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("omits interactive role when not clickable", () => {
    render(<Card title="static" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders custom children content", () => {
    render(
      <Card title="x">
        <p>custom-content</p>
      </Card>,
    );
    expect(screen.getByText("custom-content")).toBeInTheDocument();
  });
});
