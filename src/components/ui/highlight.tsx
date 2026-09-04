import * as React from "react";

/**
 * Highlight literal query words inside displayed text without ever mutating the
 * text itself. Matching is a simple case-insensitive literal on the raw words
 * (search normalization is only used for the index, never for display).
 */
export function Highlight({
  text,
  terms,
}: {
  text: string;
  terms: string[];
}): React.ReactElement {
  const words = terms.map((t) => t.trim()).filter((t) => t.length >= 2);
  if (words.length === 0) return <>{text}</>;

  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "i");
  // split() with a single capturing group places the matched text at odd indices.
  const parts = text.split(re);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i}>{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
