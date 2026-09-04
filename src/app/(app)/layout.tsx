import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { PrimaryNav } from "@/components/layout/nav";
import { TopBar } from "@/components/layout/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="bg-paper text-ink min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="border-border hidden w-56 shrink-0 border-e md:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            <Link href="/home" className="flex flex-col px-5 py-4 leading-tight">
              <span className="text-ink font-serif text-lg font-semibold">
                رنگ‌خانه
              </span>
              <span className="text-ink-muted text-xs tracking-wide">Rangkhaneh</span>
            </Link>
            <PrimaryNav variant="sidebar" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar email={user.email ?? ""} />
          <div className="border-border border-b md:hidden">
            <PrimaryNav variant="bar" />
          </div>
          <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
