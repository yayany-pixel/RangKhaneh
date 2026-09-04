import { createSupabaseServerClient } from "@/lib/supabase/server";
import { gatherArchive, buildArchiveZip } from "@/lib/export/gather";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const archive = await gatherArchive(supabase);
  const zip = await buildArchiveZip(supabase, archive);

  await supabase.from("user_settings").upsert(
    {
      owner_id: user.id,
      last_export_at: new Date().toISOString(),
      last_export_summary: archive.manifest.counts ?? {},
    },
    { onConflict: "owner_id" },
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(zip as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="rangkhaneh-archive-${stamp}.zip"`,
    },
  });
}
