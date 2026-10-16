/**
 * i18n.js
 * ---------------------------------------------------------------------------
 * UI 텍스트 다국어 처리.
 *
 *   import { t, loadUI } from "./i18n.js";
 *   await loadUI();
 *   t("nav.projects")  // 현재 언어에 맞춰 반환
 *
 * 콘텐츠(프로젝트 제목/설명)는 각 데이터 JSON 안에서 {en, ko, de} 객체로
 * 저장하고, pickLang() 헬퍼로 꺼냅니다.
 * ---------------------------------------------------------------------------
 */

import { getState } from "./state.js";

let UI = null; // data/ui.json 캐시

export async function loadUI() {
  if (UI) return UI;
  const res = await fetch("data/ui.json");
  if (!res.ok) throw new Error(`Failed to load ui.json: ${res.status}`);
  UI = await res.json();
  return UI;
}

/**
 * dot-notation key를 받아 현재 언어의 문자열을 반환.
 * 누락된 키는 키 자체를 반환해서 디버깅하기 쉽도록 함.
 */
export function t(key) {
  if (!UI) return key;
  const lang = getState().lang;
  const parts = key.split(".");

  // 1) 현재 언어에서 먼저 찾기
  let cur = UI[lang];
  for (const p of parts) {
    if (cur == null) break;
    cur = cur[p];
  }
  if (typeof cur === "string") return cur;

  // 2) 영어로 fallback
  cur = UI.en;
  for (const p of parts) {
    if (cur == null) break;
    cur = cur[p];
  }
  if (typeof cur === "string") return cur;

  // 3) 끝까지 못 찾으면 키 자체 노출 (개발 중에 즉시 발견 가능)
  console.warn(`[i18n] missing key: ${key}`);
  return key;
}

/**
 * 콘텐츠 JSON에서 다국어 필드 꺼내기.
 *   pickLang({en: "Hi", ko: "안녕", de: "Hallo"})  // 현재 언어
 *   pickLang("plain string")                       // 그냥 반환
 */
export function pickLang(field) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  const lang = getState().lang;
  return field[lang] ?? field.en ?? Object.values(field)[0] ?? "";
}
