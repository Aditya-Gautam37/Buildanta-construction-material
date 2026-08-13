// Locations are free text typed by staff, so the same place arrives in many
// shapes: "kanpur", "kanpur uttarpradesh", "Kanpur Uttar Pradesh",
// "kanpur, uttar pradesh". This formats them for display only — the stored
// value is never rewritten from the storefront.

// The single place the launch city is named. Buildanta serves only Kanpur for
// now; when that changes, this is what moves, not copy scattered across pages.
export const SERVICE_CITY = "Kanpur";
export const SERVICE_STATE = "Uttar Pradesh";
export const SERVICE_AREA = `${SERVICE_CITY}, ${SERVICE_STATE}`;

// Run-together spellings staff actually type, mapped to their proper form.
const KNOWN_STATES: Array<[RegExp, string]> = [
  [/^uttar\s*pradesh$/i, "Uttar Pradesh"],
  [/^up$/i, "Uttar Pradesh"],
];

const SMALL_WORDS = new Set(["and", "of", "the"]);

function titleCaseWord(word: string, index: number): string {
  const lower = word.toLowerCase();
  if (index > 0 && SMALL_WORDS.has(lower)) return lower;
  // Keep hyphenated and apostrophed names sensible: "kanpur-nagar" and
  // "o'brien road" should not lose their inner capitals.
  return lower.replace(/(^|[-'])([a-z])/g, (_match, boundary: string, letter: string) => boundary + letter.toUpperCase());
}

function titleCase(value: string): string {
  return value.split(/\s+/).filter(Boolean).map(titleCaseWord).join(" ");
}

function normaliseState(value: string): string | null {
  const collapsed = value.replace(/\s+/g, " ").trim();
  for (const [pattern, proper] of KNOWN_STATES) {
    if (pattern.test(collapsed)) return proper;
  }
  return null;
}

/**
 * Formats a stored location for customers.
 *
 * "kanpur uttarpradesh" -> "Kanpur, Uttar Pradesh"
 * "kanpur"              -> "Kanpur"
 * ""                    -> null (caller decides what to show instead)
 */
export function formatLocation(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  // Already comma-separated: title-case each part, fixing the state if known.
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return null;
    return parts.map((part) => normaliseState(part) ?? titleCase(part)).join(", ");
  }

  // No comma. Try to split a trailing known state off the end, so
  // "kanpur uttarpradesh" and "kanpur uttar pradesh" both work. "uttarpradesh"
  // has no space, so compare with spaces stripped.
  const words = cleaned.split(" ");
  for (let take = Math.min(words.length - 1, 3); take >= 1; take -= 1) {
    const tail = words.slice(words.length - take).join(" ");
    const state = normaliseState(tail) ?? normaliseState(tail.replace(/\s+/g, ""))
      ?? (tail.replace(/\s+/g, "").toLowerCase() === "uttarpradesh" ? "Uttar Pradesh" : null);
    if (state) {
      const city = words.slice(0, words.length - take).join(" ");
      return city ? `${titleCase(city)}, ${state}` : state;
    }
  }

  return titleCase(cleaned);
}

/** Formats a location, falling back to the launch service area when empty. */
export function formatLocationOrServiceArea(raw: string | null | undefined): string {
  return formatLocation(raw) ?? SERVICE_AREA;
}
