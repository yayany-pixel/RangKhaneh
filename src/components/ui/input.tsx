import * as React from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-accent " +
  "disabled:opacity-60";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    dir="auto"
    className={cn(base, "min-h-24 resize-y leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(base, "h-10 pr-8", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";
