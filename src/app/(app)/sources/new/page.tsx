import type { Metadata } from "next";
import { SourceForm } from "@/components/sources/source-form";

export const metadata: Metadata = { title: "New source — Rangkhaneh" };

export default function NewSourcePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-ink font-serif text-2xl font-semibold">New source</h1>
      <SourceForm />
    </div>
  );
}
