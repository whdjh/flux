import * as React from "react";

export type SplitRatioPreset = 0.5 | 0.25 | number;

export interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  orientation?: "horizontal"; // only horizontal split supported for M0
  separatorAriaLabel?: string;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function SplitView({
  left,
  right,
  defaultRatio = 0.5,
  minRatio = 0.1,
  maxRatio = 0.9,
  separatorAriaLabel = "분할 크기 조절",
  className,
}: SplitViewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = React.useState(() =>
    clamp(defaultRatio, minRatio, maxRatio),
  );
  const [dragging, setDragging] = React.useState(false);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    event.preventDefault();
    setDragging(true);
  };

  React.useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0) return;
      const raw = (event.clientX - rect.left) / rect.width;
      setRatio(clamp(raw, minRatio, maxRatio));
    };

    const stop = () => setDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging, minRatio, maxRatio]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setRatio((r) => clamp(r - step, minRatio, maxRatio));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setRatio((r) => clamp(r + step, minRatio, maxRatio));
    } else if (event.key === "Home") {
      event.preventDefault();
      setRatio(minRatio);
    } else if (event.key === "End") {
      event.preventDefault();
      setRatio(maxRatio);
    }
  };

  const percent = Math.round(ratio * 100);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `${ratio}fr var(--spacing-1) ${1 - ratio}fr`,
        height: "100%",
        width: "100%",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div style={{ overflow: "auto", minWidth: 0 }}>{left}</div>
      <div
        role="separator"
        aria-label={separatorAriaLabel}
        aria-orientation="vertical"
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        aria-valuenow={percent}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        style={{
          background: "var(--border)",
          cursor: "col-resize",
          width: "var(--spacing-1)",
          height: "100%",
          transition: dragging
            ? "none"
            : "background var(--duration-fast) var(--ease-out)",
        }}
      />
      <div style={{ overflow: "auto", minWidth: 0 }}>{right}</div>
    </div>
  );
}
