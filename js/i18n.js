import { getState } from "./state.js";

let UI = null;

export async function loadUI() {
  if (UI) return UI;
  const res = await fetch("data/ui.json");
  if (!res.ok) throw new Error(`Failed to load ui.json: ${res.status}`);
  UI = await res.json();
  return UI;
}

export function t(key) {
  if (!UI) return key;
  const lang = getState().lang;
  const parts = key.split(".");

  let cur = UI[lang];
  for (const p of parts) {
    if (cur == null) break;
    cur = cur[p];
  }
  if (typeof cur === "string") return cur;

  cur = UI.en;
  for (const p of parts) {
    if (cur == null) break;
    cur = cur[p];
  }
  if (typeof cur === "string") return cur;

  console.warn(`[i18n] missing key: ${key}`);
  return key;
}

export function pickLang(field) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  const lang = getState().lang;
  return field[lang] ?? field.en ?? field.ko ?? "";
}
