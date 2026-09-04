"use client";

import { Button, type ButtonProps } from "./button";

export function ConfirmSubmit({
  message,
  children,
  ...props
}: ButtonProps & { message: string }) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
