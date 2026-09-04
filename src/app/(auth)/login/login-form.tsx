"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: LoginState = {};

export function LoginForm({ notAllowed }: { notAllowed?: boolean }) {
  const [state, formAction] = useActionState(signIn, initial);
  const error =
    state.error ?? (notAllowed ? "This account is not allowed." : undefined);

  return (
    <form action={formAction} className="w-full">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </Field>
      {error ? (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger mb-4 rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}
      <SubmitButton className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
