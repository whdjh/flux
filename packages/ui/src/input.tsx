import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

let idCounter = 0;
function useAutoId(provided?: string): string {
  // Cheap stable id generator that doesn't rely on React 18-only hooks so
  // we stay compatible with both 18 and 19.
  const ref = React.useRef<string | null>(null);
  if (provided) return provided;
  if (!ref.current) {
    idCounter += 1;
    ref.current = `flux-input-${idCounter}`;
  }
  return ref.current;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, id, style, className, ...rest }, ref) {
    const inputId = useAutoId(id);
    const errorId = error ? `${inputId}-error` : undefined;

    const inputStyle: React.CSSProperties = {
      height: "var(--input-height)",
      padding: "0 var(--spacing-3)",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-md)",
      lineHeight: "var(--leading-normal)",
      outline: "none",
      width: "100%",
      ...style,
    };

    return (
      <div
        className={className}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-1)",
        }}
      >
        {label ? (
          <label
            htmlFor={inputId}
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--foreground)",
              fontWeight: "var(--font-medium)",
            }}
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          style={inputStyle}
          {...rest}
        />
        {error ? (
          <span
            id={errorId}
            role="alert"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--destructive)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);
