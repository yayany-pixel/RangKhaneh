import type { Metadata } from "next";
import Link from "next/link";
import { getAuthedContext } from "@/lib/auth/session";
import { ConstitutionForm } from "@/components/book/constitution-form";

export const metadata: Metadata = { title: "New constitution — Rangkhaneh" };

export default async function NewConstitutionPage() {
  await getAuthedContext();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/book" className="text-lapis text-sm hover:underline">
          ← Back to book
        </Link>
        <h1 className="text-ink mt-2 font-serif text-2xl font-semibold">
          New Book Constitution version
        </h1>
        <p className="text-ink-muted mt-1 text-sm">
          A snapshot of the project&rsquo;s current state. It may change radically
          later; older versions are preserved for existing Collision Reports.
        </p>
      </div>
      <ConstitutionForm />
    </div>
  );
}
