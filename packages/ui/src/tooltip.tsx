import * as React from "react";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  id?: string;
}

let tooltipCounter = 0;

export function Tooltip({ content, children, id }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const idRef = React.useRef<string | null>(null);
  if (!idRef.current) {
    tooltipCounter += 1;
    idRef.current = id ?? `flux-tooltip-${tooltipCounter}`;
  }
  const tooltipId = idRef.current;

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  // Clone the trigger to attach event handlers and aria-describedby.
  type TriggerProps = {
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onFocus?: React.FocusEventHandler;
    onBlur?: React.FocusEventHandler;
    "aria-describedby"?: string;
  };

  const childWithProps = children as React.ReactElement<TriggerProps>;
  const existing = childWithProps.props;
  const trigger = React.cloneElement(childWithProps, {
    onMouseEnter: (event: React.MouseEvent) => {
      existing.onMouseEnter?.(event);
      show();
    },
    onMouseLeave: (event: React.MouseEvent) => {
      existing.onMouseLeave?.(event);
      hide();
    },
    onFocus: (event: React.FocusEvent) => {
      existing.onFocus?.(event);
      show();
    },
    onBlur: (event: React.FocusEvent) => {
      existing.onBlur?.(event);
      hide();
    },
    "aria-describedby": visible ? tooltipId : existing["aria-describedby"],
  });

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
      }}
    >
      {trigger}
      {visible ? (
        <span
          role="tooltip"
          id={tooltipId}
          style={{
            position: "absolute",
            bottom: "calc(100% + var(--spacing-1))",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            padding: "var(--spacing-1) var(--spacing-2)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            fontSize: "var(--text-sm)",
            lineHeight: "var(--leading-tight)",
            whiteSpace: "nowrap",
            boxShadow: "var(--shadow-md)",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
