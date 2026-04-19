import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function variantStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: "var(--primary)",
        color: "var(--primary-foreground)",
        border: "1px solid var(--primary)",
      };
    case "secondary":
      return {
        background: "var(--secondary)",
        color: "var(--secondary-foreground)",
        border: "1px solid var(--border)",
      };
    case "destructive":
      return {
        background: "var(--destructive)",
        color: "var(--primary-foreground)",
        border: "1px solid var(--destructive)",
      };
    case "ghost":
      return {
        background: "transparent",
        color: "var(--foreground)",
        border: "1px solid transparent",
      };
  }
}

function sizeStyle(size: ButtonSize): React.CSSProperties {
  // Heights reference --button-height (32px) as baseline (md).
  switch (size) {
    case "sm":
      return {
        height: "calc(var(--button-height) - var(--spacing-1))",
        padding: "0 var(--spacing-2)",
        fontSize: "var(--text-sm)",
      };
    case "md":
      return {
        height: "var(--button-height)",
        padding: "0 var(--spacing-3)",
        fontSize: "var(--text-md)",
      };
    case "lg":
      return {
        height: "calc(var(--button-height) + var(--spacing-2))",
        padding: "0 var(--spacing-4)",
        fontSize: "var(--text-lg)",
      };
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      type = "button",
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const computedStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--spacing-2)",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--font-medium)",
      lineHeight: "var(--leading-tight)",
      transition: "background var(--duration-fast) var(--ease-out)",
      cursor: "pointer",
      ...variantStyle(variant),
      ...sizeStyle(size),
      ...style,
    };

    return (
      <button
        ref={ref}
        type={type}
        data-variant={variant}
        data-size={size}
        className={className}
        style={computedStyle}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
