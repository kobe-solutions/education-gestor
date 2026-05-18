/* global */
// Pure-function formatters and helpers used across features.

// Brazilian Real currency. R$ + non-breaking space + comma decimal.
const fmtBRL = (n) =>
  "R$\u00A0" + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 1-2 letter initials from a full name. "Helena Vasconcellos" → "HV".
const initials = (name) =>
  (name || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

// "12 KB" / "1.482 KB" — pt-BR thousands separator
function fileSizeKB(bytes) {
  if (!bytes) return "—";
  return Math.max(1, Math.round(bytes / 1024)).toLocaleString("pt-BR") + " KB";
}

Object.assign(window, { fmtBRL, initials, fileSizeKB });
