/* global */
// ─── Brand-tone palette shared by Locação screens ──────────────────────────
// Deterministic colour assignment for subjects and people, drawn from the
// IRIS palette + restrained secondary tones. Same input string → same colour.

const TONE_PALETTE = [
  { solid: "#185FA5", soft: "#EAF4FD", text: "#185FA5", border: "#BFD8F0" }, // brand blue
  { solid: "#378ADD", soft: "#E8F1FB", text: "#1F6FBD", border: "#C8DDF2" }, // mid blue
  { solid: "#042C53", soft: "#E4ECF4", text: "#042C53", border: "#BFCFE0" }, // deep navy
  { solid: "#15803D", soft: "#DCFCE7", text: "#15803D", border: "#BBF7D0" }, // green
  { solid: "#B45309", soft: "#FEF3C7", text: "#B45309", border: "#FDE68A" }, // amber
  { solid: "#7C3AED", soft: "#EFE6FE", text: "#6B21A8", border: "#DDD0F5" }, // violet (sparingly)
  { solid: "#0E7490", soft: "#DEF4F5", text: "#0E7490", border: "#BDE5E8" }, // teal
  { solid: "#9D174D", soft: "#FCE7F0", text: "#9D174D", border: "#F6CADC" }, // berry
];

function toneIndex(s) {
  let h = 0;
  for (const c of (s || "")) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return Math.abs(h) % TONE_PALETTE.length;
}
function tone(s) { return TONE_PALETTE[toneIndex(s)]; }

// Re-export under namespaced + legacy globals for back-compat with screens
Object.assign(window, {
  LOC_TONE_PALETTE: TONE_PALETTE,
  LOC_tone: tone,
  // Reuse the shared initials() from lib/formatters.jsx — exposed for
  // backwards-compatible imports inside locação screens.
  LOC_initials: window.initials,
});
