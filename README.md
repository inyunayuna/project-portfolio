# Yuna Portfolio

순수 HTML / CSS / JavaScript로 만든 정적 포트폴리오 사이트입니다.
빌드 도구나 프레임워크 없이 동작하기 때문에, **JSON 파일만 수정하면**
새 프로젝트가 사이트에 바로 반영됩니다.

---

## 1. 폴더 구조

```
portfolio/
├── index.html          ← 프로젝트 목록 (메인)
├── research.html       ← Writings 목록 (기존 주소 유지)
├── notes.html          ← 노트 (텍스트 글타래)
├── project.html        ← 프로젝트/글 상세 — ?id=xxx 로 호출
├── 404.html
├── .htaccess           ← Hostinger(Apache) 서버 설정
│
├── css/
│   └── style.css       ← 모든 스타일 (디자인 토큰은 :root 변수에)
│
├── js/
│   ├── app.js          ← 진입점 — 페이지별 뷰 마운트
│   ├── state.js        ← 언어/필터 전역 상태 (localStorage 저장)
│   ├── i18n.js         ← 다국어 헬퍼 (t, pickLang)
│   ├── header.js       ← 상단 네비 + 필터 바
│   ├── utils.js        ← 공용 유틸 (escapeHTML, fetchJSON 등)
│   ├── list-view.js    ← 목록 렌더링
│   ├── detail-view.js  ← 상세 페이지 렌더링
│   └── notes-view.js   ← 노트 렌더링
│
├── data/               ← ⭐ 콘텐츠는 모두 여기서 관리합니다
│   ├── ui.json         ← UI 텍스트 번역 (네비, 필터 라벨 등)
│   ├── projects.json   ← 프로젝트 목록
│   ├── research.json   ← Writings 목록 (기존 주소 유지)
│   └── notes.json      ← 노트 목록
│
└── assets/
    ├── images/
    │   ├── projects/<project-id>/    ← 프로젝트별 폴더로 정리
    │   └── research/<article-id>/
    └── videos/
```

---

## 2. 새 프로젝트 추가 (3단계)

### ① 이미지 업로드
```
assets/images/projects/my-new-project/
  ├── 01.jpg
  ├── 02.jpg
  └── 03.mp4   ← 영상도 가능
```
- 폴더 이름이 곧 프로젝트의 `id`가 됩니다 (소문자 + 하이픈 권장).
- 이미지: jpg / png / webp / svg 지원.
- 영상: mp4 권장.

### ② `data/projects.json`에 항목 추가
```json
{
  "id": "my-new-project",
  "year": 2026,
  "categories": ["graphic", "web"],
  "title": {
    "en": "My New Project",
    "ko": "내 새 프로젝트",
    "de": "Mein neues Projekt"
  },
  "content": [
    {
      "type": "media",
      "items": [
        { "type": "image", "src": "assets/images/projects/my-new-project/01.jpg", "alt": "표지" }
      ]
    },
    {
      "type": "text",
      "value": {
        "en": "First paragraph.\n\nSecond paragraph after a blank line.",
        "ko": "첫 단락.\n\n빈 줄 후 둘째 단락.",
        "de": "Erster Absatz."
      }
    }
  ]
}
```

#### `content` 배열 구조

콘텐츠는 **블록 배열**로, 두 가지 타입을 자유롭게 섞을 수 있습니다.

| 타입 | 필드 | 설명 |
|---|---|---|
| `"media"` | `items` 배열 | 한 행에 1~3개 이미지/영상 |
| `"text"`  | `value` 객체 | 본문. `\n\n`으로 단락 구분, `**볼드**`로 강조 |

미디어 아이템 형식:
```json
{ "type": "image", "src": "...", "alt": "선택" }
{ "type": "video", "src": "...", "poster": "선택", "autoplay": true }
```

#### `categories` 값
`graphic` · `editorial` · `web` · `product` · `workshop` · `research`

새 카테고리를 추가하려면:
1. `js/state.js`의 `FILTERS` 배열에 추가
2. `data/ui.json`의 `filters` 객체에 3개 언어 번역 추가

### ③ 저장하고 새로고침

---

## 3. Writings 글 추가

`data/research.json`에 같은 구조로 추가합니다.
이미지는 `assets/images/research/<article-id>/`에.

> 상세 페이지는 `project.html?id=xxx&src=research`로 자동 연결됩니다.

---

## 4. 노트 추가

`data/notes.json`에 항목을 추가합니다.

```json
{
  "date": "2026-01-01",
  "body": {
    "en": "Text here. [Link label](https://example.com)\n\nNew paragraph.",
    "ko": "내용. **볼드**도 가능.",
    "de": "Text hier."
  }
}
```

- `\n\n` — 단락 나누기
- `**텍스트**` — 볼드
- `[라벨](URL)` — 하이퍼링크

---

## 5. 언어 / 폰트

세 가지 언어를 지원합니다: `en` / `ko` / `de`

| 언어 | 폰트 스택 |
|---|---|
| en / de | Merriweather → Times New Roman |
| ko | MerriweatherText(영문자·숫자) → Noto Serif KR(한글·특수문자) |

한국어 모드에서는 영문자·숫자는 Merriweather가 그대로 처리하고,
한글과 특수기호만 Noto Serif KR(Medium 500)로 렌더링됩니다.

---

## 6. 디자인 토큰

`css/style.css`의 `:root`에 모두 정의되어 있습니다.

| 변수 | 의미 | 기본값 |
|---|---|---|
| `--fs-base` | 본문 폰트 사이즈 | `15px` |
| `--grid-cell` | 배경 격자 한 칸 (간격·높이 기준) | `36px` |
| `--row-pad-x` | 검은 바 좌우 안쪽 여백 | `12px` |
| `--topbar-pad-y` | 상단 흰 영역 상하 여백 | `20px` |
| `--c-fg` | 기본 텍스트·테두리 색 | `#000000` |
| `--c-bg` | 배경색 | `#ffffff` |
| `--c-muted` | 비활성 텍스트 색 | `#c4c4c4` |
| `--c-grid` | 배경 격자 라인 색 | `#000000` |

반응형 breakpoint에서 `--grid-cell`과 `--fs-base`만 줄어들고 나머지 모든 spacing이 따라옵니다.

---

## 7. Hostinger 배포

1. **파일 업로드** — `portfolio/` 안의 모든 파일을
   `public_html/` 루트에 그대로 올립니다 (FTP 또는 파일 매니저).
   - `.htaccess` 포함 (숨김 파일이므로 FTP에서 "숨김 파일 표시" 옵션 체크)
2. **SSL 활성화** — Hostinger 패널 → "SSL" → Free SSL 발급.
   `.htaccess`에서 자동 HTTPS 리다이렉트가 동작합니다.

### 업로드 후 확인
- [ ] `https://yourdomain.com/` — 프로젝트 목록 보임
- [ ] 언어 전환 (Ko / En / De) 정상 동작
- [ ] 필터 클릭 시 결과 갱신
- [ ] 프로젝트 클릭 → 상세 페이지 이동
- [ ] 모바일에서도 정상 보임
- [ ] 새로고침해도 선택한 언어 유지 (localStorage)

---

## 8. 로컬 미리보기

ES Modules를 사용하므로 `file://`로 직접 열면 동작하지 않습니다.

**VS Code Live Server** — `index.html` 우클릭 → "Open with Live Server"

**Python**
```bash
python3 -m http.server 8000
# → http://localhost:8000
```

**Node.js**
```bash
npx serve .
```

---

## 9. 자주 묻는 상황

**Q. 프로젝트 순서를 바꾸고 싶어요**
`data/projects.json` 배열 순서가 그대로 표시됩니다.

**Q. 이미지 없이 텍스트만 있는 프로젝트도 가능한가요?**
네, `content` 배열에 `"type": "text"` 블록만 넣으면 됩니다.

**Q. 디자인 그리드 / 행 높이를 바꾸고 싶어요**
`--grid-cell`을 수정하면 해당 breakpoint의 정사각형 모눈·행 높이·여백이 함께 바뀝니다. 블록 끝은 모눈선에 맞추며, 창 끝의 부분 칸은 배경에서 자연스럽게 잘립니다.

**Q. 인터랙션을 추가하고 싶어요**
- 전역 효과 → `css/style.css`
- 페이지별 효과 → 해당 view 파일 (`list-view.js` 등)
- 새 모듈 → `js/`에 파일 추가 후 `app.js`에서 import

---

## 10. 기술 스택

- HTML5 + CSS3 (Custom Properties, Grid, Flexbox)
- ES Modules (`<script type="module">`)
- Fetch API + localStorage
- 빌드 도구 없음 — 수정 후 새로고침으로 즉시 반영

지원 브라우저: 최근 2년 이내 Chrome / Safari / Firefox / Edge (IE 미지원)

## 11. 성능과 표시 동작

- Notes 박스: 세로 여백 0.5셀, 가로 여백 0.65셀, 줄간격 1.6, 문단 간격 0.8em.
- Notes와 상세 본문은 타이핑 지연 없이 즉시 표시합니다.
- 페이지에 필요한 뷰 모듈만 불러옵니다.
- 같은 언어/필터를 다시 선택하면 저장과 렌더링을 생략합니다.
- 상세/Notes/Writings는 언어 변경에만 본문을 갱신합니다.
- Writings / 글들. / Texte 탭은 기존 `research.html`, `data/research.json`, `src=research` 주소를 유지합니다.
- Work의 Research 타입은 프로젝트의 `categories`에 `"research"`를 추가하면 적용됩니다.

### 모눈 정렬 규칙

- 각 breakpoint 안에서는 `--grid-cell`을 고정하며 JavaScript로 변경하지 않습니다.
- 배경 전체는 왼쪽 원점에서 동일한 정사각형 모눈을 반복합니다. 우측 전용 모눈이나 마스크는 사용하지 않습니다.
- 컨테이너 너비는 모눈 한 칸의 배수로 내림합니다. 블록 양끝은 모눈선에 맞고, 우측에는 한 칸과 창 끝에서 잘리는 부분 칸이 남을 수 있습니다. 고정된 정사각형과 정확한 한 칸 여백을 임의의 창 너비에서 동시에 보장하지 않습니다.
- 블록 높이와 블록 사이 간격은 세로 모눈의 정수 배수입니다. 글이 줄바꿈되면 필요한 높이까지 칸 단위로 늘어납니다.
- `js/grid-alignment.js`가 너비 변경과 폰트 로딩 시 화면을 그리기 전에 정렬합니다. 별도 프레임의 높이 보정과 블록별 ResizeObserver는 사용하지 않습니다.
- 모눈 너비를 계산하거나 분배하는 JavaScript와 빈 우측 띠를 만들던 scrollbar-gutter 설정은 사용하지 않습니다.

### Work 호버 썸네일

프로젝트에 호버하거나 제목 링크에 키보드 포커스를 주면 화면 중앙에 이미지가 표시되고 첫 문단은 흰색 카드로 함께 표시됩니다. 레이어 순서는 이미지 → 모눈 → 텍스트 카드 → 프로젝트 목록입니다.

- 기본값: `content`의 첫 이미지. 이미지가 없으면 영상의 `poster`를 사용합니다.
- 별도 지정: 프로젝트 최상위에 `"thumbnail": "assets/images/projects/my-project/thumbnail.webp"`를 추가합니다.
- 이미지가 없는 프로젝트도 첫 문단이 있으면 텍스트 카드만 표시합니다.
- 썸네일은 호버할 때만 불러오며, 화면 가로·세로의 65%와 최대 840×640px 안에서 원본 비율을 유지합니다. 터치 입력에는 표시하지 않습니다.

- 이미지는 시계방향으로 200초에 한 바퀴, 텍스트 카드는 반시계방향으로 300초에 한 바퀴 회전합니다. 카드는 18초 주기로 최대 6px씩 떠다닙니다.
- 카드 위치는 호버마다 랜덤으로 정하되, 전체 회전의 대각선 길이와 이동 여유를 포함해 보이는 모눈 영역 안에 배치합니다. 좁은 화면에서는 카드 전체를 비율대로 축소하고, 리사이즈·스크롤·폰트 로딩 시 경계를 다시 계산합니다.
- 운영체제의 동작 줄이기 설정에서는 회전과 이동 애니메이션을 끕니다.
# project-portfolio
