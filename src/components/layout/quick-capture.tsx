"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaptureForm } from "@/components/cards/capture-form";

export function QuickCaptureButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      // Global "n" shortcut when not typing in a field.
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (!typing && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Quick capture</span>
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick capture"
          className="bg-ink/40 fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="border-border bg-surface mt-4 w-full max-w-xl rounded-lg border shadow-lg">
            <div className="border-border flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-ink text-base font-semibold">Quick capture</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-ink-muted hover:bg-surface-2 rounded-md p-1"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="p-5">
              <CaptureForm compact />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
