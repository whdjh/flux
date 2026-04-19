import * as React from "react";

export type ChipTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "destructive";

export interface ChipProps {
  tone?: ChipTone;
  onRemove?: () => void;
  removeAriaLabel?: string;
  className?: string;
  children: React.ReactNode;
}

function toneStyle(tone: ChipTone): React.CSSProperties {
  switch (tone) {
    case "info":
      return {
        background: "var(--accent)",
        color: "var(--accent-foreground)",
        border: "1px solid var(--border)",
      };
    case "success":
      return {
        background: "var(--success)",
        color: "var(--primary-foreground)",
        border: "1px solid var(--success)",
      };
    case "warning":
      return {
        background: "var(--warning)",
        color: "var(--foreground)",
        border: "1px solid var(--warning)",
      };
    case "destructive":
      return {
        background: "var(--destructive)",
        color: "var(--primary-foreground)",
        border: "1px solid var(--destructive)",
      };
    case "neutral":
    default:
      return {
        background: "var(--muted)",
        color: "var(--muted-foreground)",
        border: "1px solid var(--border)",
      };
  }
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { tone = "neutral", onRemove, removeAriaLabel, children, className },
  ref,
) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--spacing-1)",
    height: "var(--chip-height)",
    padding: "0 var(--spacing-2)",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-sans)",
    lineHeight: "var(--leading-tight)",
    ...toneStyle(tone),
  };

  return (
    <span
      ref={ref}
      data-tone={tone}
      className={className}
      style={style}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeAriaLabel ?? "remove"}
          onClick={onRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "var(--icon-sm)",
            height: "var(--icon-sm)",
            borderRadius: "var(--radius-full)",
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: 0,
            lineHeight: "var(--leading-tight)",
          }}
        >
          ×
        </button>
      ) : null}
    </span>
  );
});
