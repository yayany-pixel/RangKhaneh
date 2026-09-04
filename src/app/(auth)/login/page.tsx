import type { Metadata } from "next";
import { Panel } from "@/components/ui/panel";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Panel className="w-full max-w-sm p-8">
      <div className="mb-6 text-center">
        <p className="font-fa text-ink text-2xl font-semibold" lang="fa">
          رنگ‌خانه
        </p>
        <h1 className="text-ink mt-1 text-lg font-semibold">Rangkhaneh</h1>
        <p className="text-ink-muted mt-1 text-sm">
          A private archive for <em>Colors of Iran</em>.
        </p>
      </div>
      <LoginForm notAllowed={error === "not_allowed"} />
      <p className="text-ink-faint mt-6 text-center text-xs">
        Access is by invitation only. There is no public sign-up.
      </p>
    </Panel>
  );
}
