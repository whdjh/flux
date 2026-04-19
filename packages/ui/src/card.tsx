import * as React from "react";

export interface CardProps {
  title: string;
  meta?: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, meta, thumbnailSrc, thumbnailAlt, onClick, className, children },
  ref,
) {
  const clickable = typeof onClick === "function";

  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-2)",
    padding: "var(--card-padding)",
    borderRadius: "var(--card-radius)",
    background: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
    boxShadow: "var(--card-shadow)",
    cursor: clickable ? "pointer" : "default",
    transition: "background var(--duration-fast) var(--ease-out)",
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!clickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(event);
    }
  };

  return (
    <div
      ref={ref}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      aria-label={clickable ? title : undefined}
      className={className}
      style={style}
    >
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt ?? ""}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "var(--radius-md)",
            objectFit: "cover",
          }}
        />
      ) : null}
      <div
        style={{
          fontSize: "var(--text-md)",
          fontWeight: "var(--font-semibold)",
          lineHeight: "var(--leading-snug)",
          color: "var(--foreground)",
        }}
      >
        {title}
      </div>
      {meta ? (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--muted-foreground)",
            lineHeight: "var(--leading-normal)",
          }}
        >
          {meta}
        </div>
      ) : null}
      {children}
    </div>
  );
});
