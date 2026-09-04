"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  Archive,
  Layers,
  BookText,
  Library,
  Download,
  Settings,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS = {
  home: Home,
  inbox: Inbox,
  archive: Archive,
  collections: Layers,
  sources: Library,
  book: BookText,
  export: Download,
  settings: Settings,
  trash: Trash2,
} as const;

export const NAV_ITEMS: {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
  { href: "/archive", label: "Archive", icon: "archive" },
  { href: "/collections", label: "Collections", icon: "collections" },
  { href: "/sources", label: "Sources", icon: "sources" },
  { href: "/book", label: "Book", icon: "book" },
  { href: "/export", label: "Export", icon: "export" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/trash", label: "Trash", icon: "trash" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav({ variant }: { variant: "sidebar" | "bar" }) {
  const pathname = usePathname();

  if (variant === "bar") {
    return (
      <nav className="flex gap-1 overflow-x-auto px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                active
                  ? "bg-accent-soft text-lapis"
                  : "text-ink-muted hover:bg-surface-2",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
              active
                ? "bg-accent-soft text-lapis"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
