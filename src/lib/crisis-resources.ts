/**
 * Regional crisis resources for international deployment.
 * Each org has a region field. Crisis alerts and student-facing
 * messages use the org's region to show relevant hotlines.
 */

export interface CrisisResource {
  service_name: string;
  contact: string;
  availability: string;
  age_note: string;
  url: string;
}

const CRISIS_RESOURCES: Record<string, CrisisResource[]> = {
  US: [
    { service_name: "988 Suicide and Crisis Lifeline", contact: "Call or text 988 (presiona 2 para español)", availability: "24/7", age_note: "", url: "https://988lifeline.org" },
    { service_name: "Crisis Text Line", contact: "Text HOME to 741741", availability: "24/7", age_note: "", url: "https://www.crisistextline.org" },
    { service_name: "Trevor Project", contact: "1-866-488-7386", availability: "24/7", age_note: "LGBTQ+ youth", url: "https://www.thetrevorproject.org" },
  ],
  UK: [
    { service_name: "Samaritans", contact: "116 123", availability: "24/7, free", age_note: "", url: "https://www.samaritans.org" },
    { service_name: "Childline", contact: "0800 1111", availability: "24/7, free", age_note: "Under 19", url: "https://www.childline.org.uk" },
  ],
  CA: [
    { service_name: "Talk Suicide Canada", contact: "1-833-456-4566", availability: "24/7", age_note: "", url: "https://talksuicide.ca" },
    { service_name: "Kids Help Phone", contact: "1-800-668-6868", availability: "24/7", age_note: "Under 20", url: "https://kidshelpphone.ca" },
  ],
  AU: [
    { service_name: "Lifeline", contact: "13 11 14", availability: "24/7", age_note: "", url: "https://www.lifeline.org.au" },
    { service_name: "Kids Helpline", contact: "1800 55 1800", availability: "24/7", age_note: "Under 25", url: "https://kidshelpline.com.au" },
  ],
  NZ: [
    { service_name: "Lifeline", contact: "0800 543 354", availability: "24/7", age_note: "", url: "https://www.lifeline.org.nz" },
    { service_name: "Youthline", contact: "0800 376 633", availability: "24/7", age_note: "Youth", url: "https://www.youthline.co.nz" },
  ],
  IE: [
    { service_name: "Samaritans Ireland", contact: "116 123", availability: "24/7, free", age_note: "", url: "https://www.samaritans.org" },
    { service_name: "Pieta", contact: "1800 247 247", availability: "24/7", age_note: "", url: "https://www.pieta.ie" },
  ],
  ZA: [
    { service_name: "SADAG", contact: "0800 567 567", availability: "24/7", age_note: "", url: "https://www.sadag.org" },
    { service_name: "Lifeline", contact: "0861 322 322", availability: "24/7", age_note: "", url: "https://lifelinesa.co.za" },
  ],
  GLOBAL_FALLBACK: [
    { service_name: "International Association for Suicide Prevention", contact: "Find local resources", availability: "Varies by country", age_note: "", url: "https://www.iasp.info/resources/Crisis_Centres/" },
  ],
};

/**
 * Get crisis resources for an org's region.
 * Falls back to GLOBAL_FALLBACK if region not recognized.
 */
export function getRegionalResources(orgRegion: string | null): CrisisResource[] {
  const region = (orgRegion ?? "US").toUpperCase();
  return CRISIS_RESOURCES[region] ?? CRISIS_RESOURCES.GLOBAL_FALLBACK;
}

/**
 * Format resources for student-facing in-chat message.
 */
export function formatCrisisResourcesForStudent(resources: CrisisResource[]): string {
  return resources
    .map((r) => {
      const parts = [r.service_name, r.contact];
      if (r.availability) parts.push(r.availability);
      if (r.age_note) parts.push(`(${r.age_note})`);
      return parts.join(" — ");
    })
    .join("\n");
}

/**
 * Format resources for HTML email.
 */
export function formatCrisisResourcesForEmail(resources: CrisisResource[]): string {
  return resources
    .map((r) => {
      let html = `<strong>${escapeHtml(r.service_name)}</strong>: ${escapeHtml(r.contact)}`;
      if (r.availability) html += ` (${escapeHtml(r.availability)})`;
      if (r.age_note) html += ` — ${escapeHtml(r.age_note)}`;
      return `<li>${html}</li>`;
    })
    .join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
