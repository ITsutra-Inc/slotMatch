"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            block w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground
            placeholder:text-muted/60
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            disabled:bg-surface disabled:text-muted
            transition-colors duration-200
            ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
