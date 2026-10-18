const STORAGE_KEY = "yuna-portfolio-state";

const DEFAULT_STATE = {
  lang: "en",        // "en" | "ko"
  filter: "all"
};

export const LANGUAGES = ["ko", "en"];
export const FILTERS = ["all", "graphic", "editorial", "web", "product", "workshop", "installation", "research"];

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const loaded = {
      lang: LANGUAGES.includes(parsed?.lang) ? parsed.lang : DEFAULT_STATE.lang,
      filter: FILTERS.includes(parsed?.filter) ? parsed.filter : DEFAULT_STATE.filter,
    };
    if (parsed?.lang !== loaded.lang || parsed?.filter !== loaded.filter) save(loaded);
    return loaded;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function save(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const state = load();
const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(patch) {
  const changes = {};
  if (LANGUAGES.includes(patch.lang) && patch.lang !== state.lang) changes.lang = patch.lang;
  if (FILTERS.includes(patch.filter) && patch.filter !== state.filter) changes.filter = patch.filter;
  const keys = Object.keys(changes);
  if (!keys.length) return;
  Object.assign(state, changes);
  save(state);
  for (const listener of listeners) {
    if (!listener.keys.length || listener.keys.some(key => keys.includes(key))) {
      listener.fn(getState());
    }
  }
}

export function subscribe(fn, keys = []) {
  const listener = { fn, keys };
  listeners.add(listener);
  return () => listeners.delete(listener);
}
