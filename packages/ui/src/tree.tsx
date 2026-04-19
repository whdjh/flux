import * as React from "react";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

export interface TreeProps {
  nodes: TreeNode[];
  defaultExpandedIds?: string[];
  defaultSelectedId?: string;
  onSelect?: (node: TreeNode) => void;
  className?: string;
}

export function Tree({
  nodes,
  defaultExpandedIds,
  defaultSelectedId,
  onSelect,
  className,
}: TreeProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? []),
  );
  const [selected, setSelected] = React.useState<string | undefined>(
    defaultSelectedId,
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (node: TreeNode) => {
    setSelected(node.id);
    onSelect?.(node);
  };

  return (
    <ul
      role="tree"
      className={className}
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-md)",
        color: "var(--foreground)",
      }}
    >
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          selectedId={selected}
          onToggle={toggle}
          onSelect={handleSelect}
        />
      ))}
    </ul>
  );
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  selectedId: string | undefined;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
}

function TreeItem({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: TreeItemProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  const handleRowClick = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    onSelect(node);
  };

  const handleRowKey: React.KeyboardEventHandler<HTMLLIElement> = (event) => {
    // Only handle keyboard activation when the focused element is the row
    // itself. Enter/Space on the nested toggle button should not also trigger
    // row selection.
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(node);
    }
  };

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleRowKey}
      style={{
        minHeight: "var(--tree-item-height)",
        display: "flex",
        flexDirection: "column",
        background: isSelected ? "var(--accent)" : "transparent",
        color: isSelected ? "var(--accent-foreground)" : "var(--foreground)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-1)",
          minHeight: "var(--tree-item-height)",
          paddingLeft: `calc(var(--spacing-3) * ${depth + 1})`,
          paddingRight: "var(--spacing-2)",
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={node.label}
            aria-expanded={isExpanded}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            style={{
              width: "var(--icon-sm)",
              height: "var(--icon-sm)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: 0,
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition:
                "transform var(--duration-fast) var(--ease-out)",
            }}
          >
            ▶
          </button>
        ) : (
          <span
            aria-hidden
            style={{
              width: "var(--icon-sm)",
              display: "inline-block",
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            lineHeight: "var(--leading-normal)",
          }}
        >
          {node.label}
        </span>
      </div>
      {hasChildren && isExpanded ? (
        <ul
          role="group"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
