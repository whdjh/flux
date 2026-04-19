import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tree, type TreeNode } from "./tree";

const simple: TreeNode[] = [
  {
    id: "root-1",
    label: "폴더 A",
    children: [
      { id: "leaf-1", label: "문서 1" },
      { id: "leaf-2", label: "문서 2" },
    ],
  },
  { id: "root-2", label: "폴더 B" },
];

describe("Tree", () => {
  it("renders top-level nodes", () => {
    render(<Tree nodes={simple} />);
    expect(screen.getByText("폴더 A")).toBeInTheDocument();
    expect(screen.getByText("폴더 B")).toBeInTheDocument();
  });

  it("uses tree role and treeitem roles for a11y", () => {
    render(<Tree nodes={simple} />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
    const items = screen.getAllByRole("treeitem");
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it("hides children until expanded", () => {
    render(<Tree nodes={simple} />);
    expect(screen.queryByText("문서 1")).not.toBeInTheDocument();
  });

  it("expands on toggle click and reveals children", async () => {
    const user = userEvent.setup();
    render(<Tree nodes={simple} />);
    const toggle = screen.getAllByRole("button", { name: /폴더 A/i })[0];
    await user.click(toggle);
    expect(screen.getByText("문서 1")).toBeInTheDocument();
    expect(screen.getByText("문서 2")).toBeInTheDocument();
  });

  it("collapses on second toggle", async () => {
    const user = userEvent.setup();
    render(<Tree nodes={simple} />);
    const toggle = screen.getAllByRole("button", { name: /폴더 A/i })[0];
    await user.click(toggle);
    await user.click(toggle);
    expect(screen.queryByText("문서 1")).not.toBeInTheDocument();
  });

  it("respects defaultExpandedIds", () => {
    render(<Tree nodes={simple} defaultExpandedIds={["root-1"]} />);
    expect(screen.getByText("문서 1")).toBeInTheDocument();
  });

  it("fires onSelect with the clicked node", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Tree nodes={simple} defaultExpandedIds={["root-1"]} onSelect={onSelect} />,
    );
    const leaf = screen.getAllByRole("treeitem").find((el) => el.textContent?.includes("문서 1"))!;
    await user.click(leaf);
    expect(onSelect).toHaveBeenCalled();
    const called = onSelect.mock.calls[0][0];
    expect(called.id).toBe("leaf-1");
  });

  it("marks selected node with aria-selected", async () => {
    const user = userEvent.setup();
    render(<Tree nodes={simple} defaultExpandedIds={["root-1"]} />);
    const leaf = screen.getAllByRole("treeitem").find((el) => el.textContent?.includes("문서 1"))!;
    await user.click(leaf);
    expect(leaf).toHaveAttribute("aria-selected", "true");
  });

  it("sets aria-expanded on expandable nodes", () => {
    render(<Tree nodes={simple} />);
    const rootA = screen.getAllByRole("treeitem").find((el) => el.textContent?.includes("폴더 A"))!;
    expect(rootA).toHaveAttribute("aria-expanded", "false");
  });

  it("supports keyboard expand: Enter toggles expansion", async () => {
    const user = userEvent.setup();
    render(<Tree nodes={simple} />);
    const toggle = screen.getAllByRole("button", { name: /폴더 A/i })[0];
    toggle.focus();
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("문서 1")).toBeInTheDocument();
  });

  it("uses tree-item-height token for row height", () => {
    render(<Tree nodes={simple} />);
    const item = screen.getAllByRole("treeitem")[0];
    expect(item.style.minHeight).toContain("var(--tree-item-height)");
  });
});
