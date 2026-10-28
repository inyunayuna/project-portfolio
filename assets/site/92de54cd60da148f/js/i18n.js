import { getState } from "./state.js";
import { fetchJSON } from "./utils.js";

let UI = null;

export async function loadUI() {
  if (!UI) UI = await fetchJSON("data/ui.json");
  return UI;
}

export function t(key) {
  if (!UI) return key;
  const parts = key.split(".");

  for (const lang of [getState().lang, "en"]) {
    let value = UI[lang];
    for (const part of parts) value = value?.[part];
    if (typeof value === "string") return value;
  }

  console.warn(`[i18n] missing key: ${key}`);
  return key;
}

export function pickLang(field) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  const lang = getState().lang;
  return field[lang] ?? field.en ?? field.ko ?? "";
}
