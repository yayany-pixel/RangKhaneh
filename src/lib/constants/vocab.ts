// ---------------------------------------------------------------------------
// Controlled vocabulary with bilingual (en / fa) labels.
// Enum-backed values are fixed at the DB level; text-backed lists (card types,
// source types, facet types, rights, ...) are validated in the app so they can
// grow without a schema migration.
// ---------------------------------------------------------------------------

export type Option<T extends string = string> = {
  value: T;
  en: string;
  fa: string;
};

export const CARD_DOMAINS = [
  { value: "research", en: "Research", fa: "پژوهش" },
  { value: "creative", en: "Creative", fa: "خلاق" },
  { value: "personal", en: "Personal / field note", fa: "شخصی" },
  { value: "manuscript", en: "Manuscript", fa: "دست‌نوشته" },
] as const satisfies readonly Option[];

export const CARD_TYPES = [
  { value: "source_excerpt", en: "Source excerpt", fa: "گزیدهٔ منبع" },
  { value: "quotation", en: "Quotation", fa: "نقل‌قول" },
  { value: "research_note", en: "Research note", fa: "یادداشت پژوهشی" },
  { value: "claim_hypothesis", en: "Claim or hypothesis", fa: "ادعا یا فرضیه" },
  { value: "counterargument", en: "Counterargument", fa: "ضدّاستدلال" },
  { value: "linguistic_note", en: "Linguistic note", fa: "یادداشت زبانی" },
  { value: "color_term", en: "Color term", fa: "اصطلاح رنگ" },
  {
    value: "material_process",
    en: "Pigment, dye, material, or process",
    fa: "رنگدانه، رنگ، ماده یا فرایند",
  },
  {
    value: "artwork_object",
    en: "Artwork, artifact, object, or building",
    fa: "اثر هنری یا شیء",
  },
  {
    value: "image_observation",
    en: "Image or visual observation",
    fa: "تصویر یا مشاهدهٔ دیداری",
  },
  {
    value: "historical_practice",
    en: "Historical practice or event",
    fa: "رسم یا رویداد تاریخی",
  },
  {
    value: "interview_oral_history",
    en: "Interview or oral history",
    fa: "مصاحبه یا تاریخ شفاهی",
  },
  { value: "field_note", en: "Field note", fa: "یادداشت میدانی" },
  { value: "memory_dream", en: "Memory or dream", fa: "خاطره یا رؤیا" },
  { value: "question_gap", en: "Question or research gap", fa: "پرسش یا خلأ" },
  { value: "poem", en: "Poem", fa: "شعر" },
  { value: "fiction_fragment", en: "Fiction fragment", fa: "پارهٔ داستانی" },
  { value: "handwritten_page", en: "Handwritten page", fa: "برگ دست‌نویس" },
  { value: "book_passage", en: "Book passage", fa: "بخش کتاب" },
  {
    value: "bibliographic_source",
    en: "Bibliographic source",
    fa: "منبع کتاب‌شناختی",
  },
  { value: "other", en: "Other", fa: "دیگر" },
] as const satisfies readonly Option[];

export const WORKFLOW_STATUSES = [
  { value: "inbox", en: "Inbox", fa: "صندوق ورودی" },
  { value: "processing", en: "Processing", fa: "در حال پردازش" },
  { value: "processed", en: "Processed", fa: "پردازش‌شده" },
  { value: "collision_tested", en: "Collision tested", fa: "آزمون‌شده" },
  { value: "connected", en: "Connected", fa: "متصل" },
  { value: "book_candidate", en: "Book candidate", fa: "نامزد کتاب" },
  { value: "used_in_book", en: "Used in book", fa: "به‌کاررفته" },
  { value: "independent_value", en: "Independent value", fa: "ارزش مستقل" },
  { value: "dormant", en: "Dormant", fa: "خفته" },
  { value: "archived", en: "Archived", fa: "بایگانی" },
] as const satisfies readonly Option[];

export const EPISTEMIC_STATUSES = [
  { value: "not_applicable", en: "Not applicable", fa: "بی‌ارتباط" },
  { value: "unreviewed", en: "Unreviewed", fa: "بررسی‌نشده" },
  { value: "sourced", en: "Sourced", fa: "دارای منبع" },
  { value: "verified", en: "Verified", fa: "تأییدشده" },
  { value: "plausible", en: "Plausible", fa: "محتمل" },
  { value: "uncertain", en: "Uncertain", fa: "نامطمئن" },
  { value: "disputed", en: "Disputed", fa: "مورد مناقشه" },
  { value: "speculative", en: "Speculative", fa: "گمانه‌زنانه" },
] as const satisfies readonly Option[];

export const BOOK_RELATIONS = [
  { value: "untested", en: "Untested", fa: "آزمون‌نشده" },
  { value: "central", en: "Central", fa: "محوری" },
  { value: "supports", en: "Supports", fa: "پشتیبان" },
  { value: "complicates", en: "Complicates", fa: "پیچیده‌کننده" },
  { value: "contradicts", en: "Contradicts", fa: "متناقض" },
  { value: "extends", en: "Extends", fa: "گسترش‌دهنده" },
  { value: "reframes", en: "Reframes", fa: "بازچارچوب" },
  { value: "illustrates", en: "Illustrates", fa: "نمونه" },
  { value: "inspires", en: "Inspires", fa: "الهام‌بخش" },
  { value: "context_only", en: "Context only", fa: "فقط زمینه" },
  { value: "independent_value", en: "Independent value", fa: "ارزش مستقل" },
  { value: "no_current_fit", en: "No current fit", fa: "بدون تناسب فعلی" },
] as const satisfies readonly Option[];

export const FACET_TYPES = [
  { value: "color_term", en: "Color or color term", fa: "رنگ" },
  { value: "material", en: "Pigment, dye, or material", fa: "ماده" },
  { value: "place", en: "Place or region", fa: "مکان" },
  { value: "period", en: "Historical period or dynasty", fa: "دوره" },
  { value: "person", en: "Person", fa: "شخص" },
  { value: "culture_language", en: "Culture or language", fa: "فرهنگ/زبان" },
  { value: "artwork_object_type", en: "Artwork or object type", fa: "نوع اثر" },
  { value: "medium", en: "Medium", fa: "رسانه" },
  { value: "motif", en: "Motif", fa: "نقش‌مایه" },
  { value: "ritual_practice", en: "Ritual or practice", fa: "آیین" },
  { value: "discipline", en: "Discipline", fa: "رشته" },
  { value: "custom", en: "Custom", fa: "سفارشی" },
] as const satisfies readonly Option[];

export const SOURCE_TYPES = [
  { value: "book", en: "Book", fa: "کتاب" },
  { value: "article", en: "Article", fa: "مقاله" },
  { value: "chapter", en: "Book chapter", fa: "فصل کتاب" },
  { value: "website", en: "Website", fa: "وب‌سایت" },
  { value: "manuscript", en: "Manuscript", fa: "دست‌نوشته" },
  { value: "archive", en: "Archive or library", fa: "بایگانی" },
  { value: "artwork", en: "Artwork or object", fa: "اثر هنری" },
  { value: "interview", en: "Interview", fa: "مصاحبه" },
  { value: "audio", en: "Audio", fa: "صوت" },
  { value: "video", en: "Video", fa: "ویدیو" },
  { value: "dataset", en: "Dataset", fa: "داده" },
  { value: "other", en: "Other", fa: "دیگر" },
] as const satisfies readonly Option[];

export const RIGHTS_STATUSES = [
  { value: "unknown", en: "Unknown", fa: "نامعلوم" },
  { value: "public_domain", en: "Public domain", fa: "مالکیت عمومی" },
  { value: "permission_granted", en: "Permission granted", fa: "با اجازه" },
  { value: "fair_use", en: "Fair use", fa: "استفادهٔ منصفانه" },
  { value: "personal_use_only", en: "Personal use only", fa: "فقط شخصی" },
  { value: "restricted", en: "Restricted", fa: "محدود" },
  { value: "unclear", en: "Unclear", fa: "مبهم" },
] as const satisfies readonly Option[];

export const DATE_PRECISIONS = [
  { value: "unknown", en: "Unknown", fa: "نامعلوم" },
  { value: "exact", en: "Exact", fa: "دقیق" },
  { value: "year", en: "Year", fa: "سال" },
  { value: "decade", en: "Decade", fa: "دهه" },
  { value: "century", en: "Century", fa: "سده" },
  { value: "period", en: "Period", fa: "دوره" },
  { value: "range", en: "Range", fa: "بازه" },
] as const satisfies readonly Option[];

export const CALENDAR_SYSTEMS = [
  { value: "gregorian", en: "Gregorian", fa: "میلادی" },
  { value: "hijri_solar", en: "Hijri solar (Shamsi)", fa: "هجری شمسی" },
  { value: "hijri_lunar", en: "Hijri lunar (Qamari)", fa: "هجری قمری" },
  { value: "other", en: "Other", fa: "دیگر" },
] as const satisfies readonly Option[];

export const CARD_RELATION_TYPES = [
  { value: "supports", en: "Supports", fa: "پشتیبانی می‌کند" },
  { value: "contradicts", en: "Contradicts", fa: "متناقض است" },
  { value: "complicates", en: "Complicates", fa: "پیچیده می‌کند" },
  { value: "extends", en: "Extends", fa: "گسترش می‌دهد" },
  { value: "reframes", en: "Reframes", fa: "بازچارچوب می‌کند" },
  { value: "quotes", en: "Quotes", fa: "نقل می‌کند" },
  { value: "responds_to", en: "Responds to", fa: "پاسخ می‌دهد" },
  { value: "derived_from", en: "Derived from", fa: "برگرفته از" },
  { value: "same_source", en: "Same source", fa: "منبع یکسان" },
  { value: "same_object", en: "Same object", fa: "شیء یکسان" },
  { value: "same_term", en: "Same term", fa: "اصطلاح یکسان" },
  { value: "same_period", en: "Same period", fa: "دورهٔ یکسان" },
  { value: "same_place", en: "Same place", fa: "مکان یکسان" },
  { value: "same_motif", en: "Same motif", fa: "نقش‌مایهٔ یکسان" },
  { value: "possible_sequence", en: "Possible sequence", fa: "توالی ممکن" },
  { value: "related", en: "Related", fa: "مرتبط" },
] as const satisfies readonly Option[];

export const BOOK_NODE_TYPES = [
  { value: "project", en: "Project", fa: "پروژه" },
  { value: "part", en: "Part", fa: "بخش" },
  { value: "chapter", en: "Chapter", fa: "فصل" },
  { value: "section", en: "Section", fa: "زیربخش" },
] as const satisfies readonly Option[];

export const CARD_BOOK_USE_STATUSES = [
  { value: "proposed", en: "Proposed", fa: "پیشنهادی" },
  { value: "drafted", en: "Drafted", fa: "پیش‌نویس" },
  { value: "used", en: "Used", fa: "به‌کاررفته" },
  { value: "rejected", en: "Rejected", fa: "ردشده" },
] as const satisfies readonly Option[];

export const COLLISION_VERDICTS = [
  { value: "use", en: "Use in book", fa: "استفاده در کتاب" },
  { value: "hold", en: "Hold / revisit", fa: "نگه‌داشتن" },
  { value: "reject", en: "Does not fit", fa: "بدون تناسب" },
  { value: "independent", en: "Keep as independent", fa: "ارزش مستقل" },
  { value: "needs_more", en: "Needs more work", fa: "نیازمند بررسی" },
] as const satisfies readonly Option[];

export const ATTACHMENT_KINDS = [
  { value: "image", en: "Image", fa: "تصویر" },
  { value: "pdf", en: "PDF", fa: "پی‌دی‌اف" },
  { value: "text", en: "Text file", fa: "متن" },
  { value: "audio", en: "Audio", fa: "صوت" },
  { value: "video_link", en: "Video link", fa: "پیوند ویدیو" },
  { value: "handwriting", en: "Handwriting scan", fa: "اسکن دست‌خط" },
  { value: "other", en: "Other", fa: "دیگر" },
] as const satisfies readonly Option[];

// ------- helpers -------

export function values<T extends readonly Option[]>(options: T): T[number]["value"][] {
  return options.map((o) => o.value);
}

export function labelOf(
  options: readonly Option[],
  value: string | null | undefined,
  lang: "en" | "fa" = "en",
): string {
  if (!value) return "";
  const found = options.find((o) => o.value === value);
  return found ? found[lang] : value;
}
