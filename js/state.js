/**
 * state.js
 * ---------------------------------------------------------------------------
 * 전역 상태 (현재 언어 / 필터)를 한 곳에서 관리합니다.
 * localStorage에 저장해서 새로고침해도 유지됩니다.
 *
 * - 상태가 바뀌면 등록된 listener들이 호출됩니다 (간단한 pub/sub).
 * - 새로운 상태 키가 필요해도 여기 한 군데만 늘리면 됩니다.
 * ---------------------------------------------------------------------------
 */

const STORAGE_KEY = "yuna-portfolio-state";

const DEFAULT_STATE = {
  lang: "en",        // "en" | "ko" | "de"
  filter: "all"
};

const VALID_LANGS    = ["en", "ko", "de"];
export const FILTERS = ["all", "graphic", "editorial", "web", "product", "workshop", "research"];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    // 유효성 체크 — 손상된 값이면 기본값으로
    return {
      lang: VALID_LANGS.includes(parsed?.lang) ? parsed.lang : DEFAULT_STATE.lang,
      filter: FILTERS.includes(parsed?.filter) ? parsed.filter : DEFAULT_STATE.filter,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage 비활성화 환경 — 무시 */
  }
}

const state = load();
const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(patch) {
  const changes = {};
  if (VALID_LANGS.includes(patch.lang) && patch.lang !== state.lang) changes.lang = patch.lang;
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
