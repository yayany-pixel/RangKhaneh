import type { Metadata } from "next";
import { CaptureForm } from "@/components/cards/capture-form";

export const metadata: Metadata = { title: "Quick capture — Rangkhaneh" };

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-5">
        <h1 className="text-ink font-serif text-2xl font-semibold">Quick capture</h1>
        <p className="text-ink-muted mt-1 text-sm">
          Capture first, organize later. Content alone is enough — everything else can
          wait. The card lands in your Inbox.
        </p>
      </header>
      <CaptureForm />
    </div>
  );
}
