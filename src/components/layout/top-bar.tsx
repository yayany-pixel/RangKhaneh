import { Search } from "lucide-react";
import { QuickCaptureButton } from "./quick-capture";

export function TopBar({ email }: { email: string }) {
  return (
    <header className="border-border bg-paper/90 sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur sm:px-6">
      <form action="/archive" className="relative max-w-md min-w-0 flex-1">
        <Search
          className="text-ink-faint pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          placeholder="Search the archive…"
          aria-label="Search the archive"
          dir="auto"
          className="border-border bg-surface text-ink placeholder:text-ink-faint focus-visible:outline-accent h-9 w-full rounded-md border pr-3 pl-8 text-sm focus-visible:outline-2"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <QuickCaptureButton />
        <span
          className="text-ink-muted hidden max-w-[12rem] truncate text-xs lg:inline"
          title={email}
        >
          {email}
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="border-border text-ink-muted hover:bg-surface-2 rounded-md border px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
