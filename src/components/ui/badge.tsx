import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "lapis" | "saffron" | "madder" | "turquoise" | "verdigris";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-muted border-border",
  lapis: "bg-accent-soft text-lapis border-lapis/30",
  saffron: "bg-saffron/15 text-saffron border-saffron/30",
  madder: "bg-madder/12 text-madder border-madder/30",
  turquoise: "bg-turquoise/12 text-turquoise border-turquoise/30",
  verdigris: "bg-verdigris/12 text-verdigris border-verdigris/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
