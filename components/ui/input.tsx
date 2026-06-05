"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full min-w-0 rounded-md border bg-white px-3 text-sm shadow-field outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-field outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-11 w-full min-w-0 rounded-md border bg-white px-3 text-sm shadow-field outline-none transition focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
    );
  },
);
Select.displayName = "Select";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-emerald-950">
      <span className="break-words">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
