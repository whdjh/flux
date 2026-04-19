import * as React from "react";

export type IconSize = "sm" | "md" | "lg";

export interface IconProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "aria-hidden"> {
  size?: IconSize;
  children: React.ReactNode;
}

function sizeToken(size: IconSize): string {
  switch (size) {
    case "sm":
      return "var(--icon-sm)";
    case "md":
      return "var(--icon-md)";
    case "lg":
      return "var(--icon-lg)";
  }
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    size = "md",
    viewBox = "0 0 24 24",
    children,
    style,
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const dim = sizeToken(size);
  const svgStyle: React.CSSProperties = {
    width: dim,
    height: dim,
    flexShrink: 0,
    ...style,
  };

  const accessibilityProps: {
    role?: "img";
    "aria-label"?: string;
    "aria-hidden"?: "true";
  } = ariaLabel
    ? { role: "img", "aria-label": ariaLabel }
    : { "aria-hidden": "true" };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="currentColor"
      style={svgStyle}
      {...accessibilityProps}
      {...rest}
    >
      {children}
    </svg>
  );
});
