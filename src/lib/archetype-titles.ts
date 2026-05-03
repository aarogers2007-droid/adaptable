/**
 * Archetype Title System — deterministic lookup from Circle 2 × Circle 4.
 *
 * No AI, no randomness. Same inputs → same title, always.
 * 5 archetypes × 4 scales = 20 combinations, all enforced at compile time.
 */

// ── Stored value types (exact strings written to invention_sessions) ──

const ARCHETYPES = ["builder", "empath", "systems_thinker", "connector", "storyteller"] as const;
const SCALES = ["one_person", "community", "generation", "world"] as const;

type Archetype = (typeof ARCHETYPES)[number];
type Scale = (typeof SCALES)[number];

// ── Cross-product key type — compiler enforces all 20 entries ──

type TitleKey = `${Archetype}__${Scale}`;

/**
 * The complete title map. TypeScript enforces that every combination
 * of Archetype × Scale has an entry. Adding a new archetype or scale
 * without updating this map is a compile-time error.
 */
const TITLE_MAP: Record<TitleKey, string> = {
  builder__one_person: "The Artisan",
  builder__community: "The Foundation",
  builder__generation: "The Blueprint",
  builder__world: "The Frontier",

  empath__one_person: "The Anchor",
  empath__community: "The Hearth",
  empath__generation: "The Lantern",
  empath__world: "The Pulse",

  systems_thinker__one_person: "The Decoder",
  systems_thinker__community: "The Lever",
  systems_thinker__generation: "The Framework",
  systems_thinker__world: "The Cartographer",

  connector__one_person: "The Gateway",
  connector__community: "The Weaver",
  connector__generation: "The Conductor",
  connector__world: "The Nexus",

  storyteller__one_person: "The Chronicle",
  storyteller__community: "The Herald",
  storyteller__generation: "The Myth",
  storyteller__world: "The Legend",
};

// ── Normalization ──

/**
 * Normalize a raw stored value to its canonical form.
 * Trims whitespace, lowercases, and collapses internal spaces to underscores.
 */
function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

function isArchetype(value: string): value is Archetype {
  return (ARCHETYPES as readonly string[]).includes(value);
}

function isScale(value: string): value is Scale {
  return (SCALES as readonly string[]).includes(value);
}

// ── Public API ──

/**
 * Look up the archetype title from raw Circle 2 and Circle 4 stored values.
 * Throws a descriptive error if either value is unrecognized — never returns
 * a fallback or empty string.
 */
export function getArchetypeTitle(
  rawArchetype: string | null | undefined,
  rawScale: string | null | undefined,
): string {
  if (!rawArchetype || !rawScale) {
    throw new Error(
      `[archetype-titles] Missing input. archetype=${JSON.stringify(rawArchetype)}, scale=${JSON.stringify(rawScale)}. Both Circle 2 and Circle 4 must be completed.`
    );
  }

  const archetype = normalize(rawArchetype);
  const scale = normalize(rawScale);

  if (!isArchetype(archetype)) {
    throw new Error(
      `[archetype-titles] Unknown archetype "${rawArchetype}" (normalized: "${archetype}"). Valid values: ${ARCHETYPES.join(", ")}`
    );
  }

  if (!isScale(scale)) {
    throw new Error(
      `[archetype-titles] Unknown scale "${rawScale}" (normalized: "${scale}"). Valid values: ${SCALES.join(", ")}`
    );
  }

  const key: TitleKey = `${archetype}__${scale}`;
  return TITLE_MAP[key];
}

/** All valid archetypes for external reference. */
export { ARCHETYPES, SCALES, TITLE_MAP };
export type { Archetype, Scale, TitleKey };
