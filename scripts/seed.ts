/**
 * Development seed — labelled EXAMPLE data that demonstrates the model without
 * pretending any claim is verified. Every record uses a fixed UUID so it can be
 * removed cleanly with `npm run seed -- --clean`.
 *
 * Usage:
 *   npm run seed                # insert/refresh the example set
 *   npm run seed -- --clean     # remove the example set
 *
 * Requires (server-only, never shipped to the browser):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_OWNER_EMAIL   (an allowlisted user that already exists in auth.users)
 */
import "dotenv/config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { normalizeTag } from "../src/lib/search/normalize";

// Deterministic ids so the seed is idempotent and removable.
const ID = {
  card_sabz: "00000000-0000-4000-8000-000000000101",
  card_naming: "00000000-0000-4000-8000-000000000102",
  card_poem: "00000000-0000-4000-8000-000000000103",
  constitution: "00000000-0000-4000-8000-000000000201",
  collection: "00000000-0000-4000-8000-000000000301",
  facet_sabz: "00000000-0000-4000-8000-000000000401",
  tag_example: "00000000-0000-4000-8000-000000000501",
  tag_naming: "00000000-0000-4000-8000-000000000502",
} as const;

const CARD_IDS = [ID.card_sabz, ID.card_naming, ID.card_poem];

async function resolveOwnerId(
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  const explicit = process.env.SEED_OWNER_ID;
  if (explicit) return explicit;

  const email = process.env.SEED_OWNER_EMAIL?.toLowerCase();
  if (!email) {
    throw new Error(
      "Set SEED_OWNER_EMAIL (or SEED_OWNER_ID) to an existing allowlisted user.",
    );
  }

  // Page through auth users to find the matching email.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  throw new Error(`No auth user found for SEED_OWNER_EMAIL="${email}".`);
}

async function clean(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  owner: string,
) {
  // Children first, then parents. FK cascades cover the join tables.
  await admin.from("collision_reports").delete().in("card_id", CARD_IDS);
  await admin.from("collection_cards").delete().eq("collection_id", ID.collection);
  await admin.from("card_tags").delete().in("card_id", CARD_IDS);
  await admin.from("card_facets").delete().in("card_id", CARD_IDS);
  await admin.from("facet_aliases").delete().eq("facet_id", ID.facet_sabz);
  await admin.from("cards").delete().in("id", CARD_IDS).eq("owner_id", owner);
  await admin
    .from("collections")
    .delete()
    .eq("id", ID.collection)
    .eq("owner_id", owner);
  await admin.from("facets").delete().eq("id", ID.facet_sabz).eq("owner_id", owner);
  await admin
    .from("tags")
    .delete()
    .in("id", [ID.tag_example, ID.tag_naming])
    .eq("owner_id", owner);
  await admin
    .from("book_constitutions")
    .delete()
    .eq("id", ID.constitution)
    .eq("owner_id", owner);
  console.log("Removed example seed data.");
}

async function seed(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  owner: string,
) {
  const now = new Date().toISOString();

  // ---- Facet + aliases (the color term sabz) ----
  await admin.from("facets").upsert(
    {
      id: ID.facet_sabz,
      owner_id: owner,
      facet_type: "color_term",
      label_en: "sabz (green)",
      label_fa: "سبز",
      description: "EXAMPLE DATA — the Persian color term sabz / سبز.",
    },
    { onConflict: "id" },
  );
  await admin.from("facet_aliases").upsert(
    [
      { owner_id: owner, facet_id: ID.facet_sabz, alias: "sabz" },
      { owner_id: owner, facet_id: ID.facet_sabz, alias: "sabzi" },
      { owner_id: owner, facet_id: ID.facet_sabz, alias: "سبز" },
    ],
    { onConflict: "facet_id,alias" },
  );

  // ---- Tags ----
  await admin.from("tags").upsert(
    [
      {
        id: ID.tag_example,
        owner_id: owner,
        label: "example-data",
        normalized: normalizeTag("example-data"),
      },
      {
        id: ID.tag_naming,
        owner_id: owner,
        label: "naming",
        normalized: normalizeTag("naming"),
      },
    ],
    { onConflict: "id" },
  );

  // ---- Cards ----
  await admin.from("cards").upsert(
    [
      {
        id: ID.card_sabz,
        owner_id: owner,
        title: "سبز، sabz, and sabzi",
        domain: "research",
        card_type: "linguistic_note",
        workflow_status: "processing",
        epistemic_status: "unreviewed",
        book_relation: "complicates",
        original_content:
          "EXAMPLE DATA. In Persian, سبز (sabz) names green, while سبزی (sabzi) means both greenery/herbs and vegetables. The everyday slide between the color and the edible plant is worth interrogating rather than assuming.",
        annotation:
          "Does the color term precede the plant term, or is the color named after the growing herb? Treat as an open question.",
        questions:
          "Is sabz -> sabzi derivation, or shared root? What do classical dictionaries say?",
        why_it_matters:
          "If color words in Persian are frequently grounded in materials and plants, the book's naming thesis needs qualification.",
        language_codes: ["fa", "en"],
        original_language: "fa",
        date_precision: "unknown",
        calendar_system: "gregorian",
        captured_at: now,
      },
      {
        id: ID.card_naming,
        owner_id: owner,
        title: "Object-to-color vs. color-to-object naming",
        domain: "research",
        card_type: "counterargument",
        workflow_status: "processing",
        epistemic_status: "speculative",
        book_relation: "contradicts",
        original_content:
          "EXAMPLE DATA. A counterargument to a tidy 'colors of Iran' naming story: many color words may descend from objects (pistachio, saffron, madder), so a color-first narrative risks reversing the actual direction of naming.",
        annotation:
          "Hold this up against every claim that a color 'comes from' a cultural meaning. The material may come first.",
        why_it_matters:
          "Keeps the central thesis honest by preserving the strongest objection to it.",
        language_codes: ["en"],
        original_language: "en",
        date_precision: "unknown",
        calendar_system: "gregorian",
        captured_at: now,
      },
      {
        id: ID.card_poem,
        owner_id: owner,
        title: "Fragment: the dyer's hands",
        domain: "creative",
        card_type: "poem",
        workflow_status: "inbox",
        epistemic_status: "not_applicable",
        book_relation: "untested",
        original_content:
          "EXAMPLE DATA.\nThe dyer's hands keep\nsaffron under the nails —\nevening, the color of work.",
        why_it_matters:
          "A creative fragment kept for its own sake; not to be judged by research truth criteria.",
        language_codes: ["en"],
        original_language: "en",
        date_precision: "unknown",
        calendar_system: "gregorian",
        captured_at: now,
      },
    ],
    { onConflict: "id" },
  );

  // ---- Card links: tags + facet ----
  await admin.from("card_tags").upsert(
    [
      { card_id: ID.card_sabz, tag_id: ID.tag_example, owner_id: owner },
      { card_id: ID.card_sabz, tag_id: ID.tag_naming, owner_id: owner },
      { card_id: ID.card_naming, tag_id: ID.tag_example, owner_id: owner },
      { card_id: ID.card_naming, tag_id: ID.tag_naming, owner_id: owner },
      { card_id: ID.card_poem, tag_id: ID.tag_example, owner_id: owner },
    ],
    { onConflict: "card_id,tag_id" },
  );
  await admin
    .from("card_facets")
    .upsert([{ card_id: ID.card_sabz, facet_id: ID.facet_sabz, owner_id: owner }], {
      onConflict: "card_id,facet_id",
    });

  // ---- Book Constitution (development example) ----
  await admin.from("book_constitutions").upsert(
    {
      id: ID.constitution,
      owner_id: owner,
      version_name: "Working Constitution 0.1",
      is_current: false,
      project_description:
        "EXAMPLE DATA — a development-only constitution for Colors of Iran.",
      central_questions:
        "How are colors named, made, and used across Iranian material and literary culture?",
      provisional_thesis:
        "Color in Iran is inseparable from the materials and practices that produce it.",
      counter_theses:
        "Many color words descend from objects, so a color-first narrative may reverse the true order of naming.",
      methodology:
        "Separate quotation, paraphrase, interpretation, and invention. Treat uncertainty as information.",
      ethics:
        "Respect sources and communities; do not flatten oral history into decoration.",
      tone: "Calm, scholarly, editorial.",
      known_problems:
        "The naming thesis is not yet tested against linguistic counter-evidence.",
      revision_note: "Initial development example.",
    },
    { onConflict: "id" },
  );

  // ---- Collection: Naming Problems ----
  await admin.from("collections").upsert(
    {
      id: ID.collection,
      owner_id: owner,
      title: "Naming Problems",
      description: "EXAMPLE DATA — cards that complicate how colors get their names.",
    },
    { onConflict: "id" },
  );
  await admin.from("collection_cards").upsert(
    [
      {
        collection_id: ID.collection,
        card_id: ID.card_sabz,
        owner_id: owner,
        position: 0,
      },
      {
        collection_id: ID.collection,
        card_id: ID.card_naming,
        owner_id: owner,
        position: 1,
      },
    ],
    { onConflict: "collection_id,card_id" },
  );

  console.log("Inserted example seed data (3 cards, 1 constitution, 1 collection).");
  console.log("Remove it any time with:  npm run seed -- --clean");
}

async function main() {
  const admin = createSupabaseAdminClient();
  const owner = await resolveOwnerId(admin);
  if (process.argv.includes("--clean")) {
    await clean(admin, owner);
  } else {
    await seed(admin, owner);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
