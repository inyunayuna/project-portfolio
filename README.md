# Yuna Portfolio

순수 HTML / CSS / JavaScript로 만든 정적 포트폴리오 사이트입니다.
프레임워크 없이 동작하며, **JSON 파일만 수정하면** 새 글과 프로젝트가 반영됩니다.
이미지 최적화본 생성과 JS/CSS 배포 준비는 선택한 소스를 바꿀 때만 실행합니다(아래 10절).

---

## 1. 폴더 구조

```
portfolio/
├── index.html          ← 프로젝트 목록 (메인)
├── writings.html       ← Writings 목록
├── notes.html          ← 노트 (텍스트 글타래)
├── cv.html             ← CV (현재 작업 중 안내)
├── project.html        ← 프로젝트/글 상세 — ?id=xxx 로 호출
├── 404.html
├── .htaccess           ← Hostinger(Apache) 서버 설정
│
├── css/
│   └── style.css       ← 모든 스타일 (디자인 토큰은 :root 변수에)
│
├── js/
│   ├── app.js          ← 진입점 — 페이지별 뷰 마운트
│   ├── state.js        ← 언어/필터 전역 상태 (sessionStorage 저장)
│   ├── i18n.js         ← 다국어 헬퍼 (t, pickLang)
│   ├── header.js       ← 상단 네비 + 필터 바
│   ├── utils.js        ← 공용 유틸 (escapeHTML, fetchJSON 등)
│   ├── list-view.js    ← 목록 렌더링
│   ├── detail-view.js  ← 상세 페이지 렌더링
│   ├── project-data.js ← 프로젝트·Writings 본문 로딩·요청 캐시
│   └── notes-view.js   ← 노트 렌더링
│
├── data/               ← ⭐ 콘텐츠는 모두 여기서 관리합니다
│   ├── ui.json         ← UI 텍스트 번역 (네비, 필터 라벨 등)
│   ├── cv.json         ← CV 문구 (한글/영문)
│   ├── projects.json   ← 프로젝트 순서·제목·연도·태그·본문 파일 경로
│   ├── projects/       ← 프로젝트별 긴 본문 (id + content)
│   │   ├── project-3-welcome-kit-for-hfk-uni-bremen-digital-media-2026.json  ← Welcome Kit
│   │   ├── project-2-draftie.json  ← Draftie
│   │   └── project-1-another-audience.json  ← Another Audience
│   ├── writings.json   ← Writings 순서·제목·연도·본문 파일 경로
│   ├── writings/       ← Writings 항목별 본문 (id + content)
│   │   └── writings-1-another-audience.json
│   └── notes.json      ← 노트 목록
│
└── assets/
    └── images/
        ├── projects/<project-id>/    ← 프로젝트별 폴더로 정리
        └── writings/<article-id>/
```

---

## 2. 새 프로젝트 추가 (4단계)

### ① 이미지 업로드
```
assets/images/projects/project-4/
  ├── 01.jpg
  ├── 02.jpg
  └── 03.jpg
```
- 이미지 폴더명은 자유롭게 정하며, JSON의 `src` 경로와 일치시키면 됩니다.
- 이미지: jpg / png / webp / svg 지원.
- 영상은 Vimeo 등 외부 서비스에 올린 뒤, 임베드 코드의 `iframe src` 주소로 연결합니다.

### ② `data/projects.json`에 목록 정보 추가

목록 파일에는 짧은 정보와 본문 파일 경로만 넣습니다. 배열 순서가 사이트 표시 순서입니다.

```json
{
  "id": "MyNewProject",
  "year": 2026,
  "categories": ["graphic", "web"],
  "title": {
    "en": "My New Project",
    "ko": "내 새 프로젝트"
  },
  "contentFile": "data/projects/project-4-my-new-project.json"
}
```

### ③ `data/projects/project-4-my-new-project.json`에 본문 작성

`id`는 `Draftie`, `AnotherAudience`, `WelcomeKit`처럼 짧은 영문 제목으로 지정합니다. 주소는 `project.html?id=Draftie` 형식이며, 별도 페이지나 주소 설정을 추가하지 않습니다. 본문 파일명은 자유롭게 정하되, 목록의 `contentFile`과 일치시킵니다.

프로젝트별 파일은 `id`와 `content`만 담습니다. `id`는 목록의 값과 일치해야 합니다. 기존 글의 긴 설명·이미지·영상 순서는 이 파일에서 수정합니다.

```json
{
  "id": "MyNewProject",
  "content": [
    {
      "type": "media",
      "items": [
        { "type": "image", "src": "assets/images/projects/project-4/01.jpg", "alt": "표지" }
      ]
    },
    {
      "type": "text",
      "value": {
        "en": "First paragraph.\n\nSecond paragraph after a blank line.",
        "ko": "첫 단락.\n\n빈 줄 후 둘째 단락."
      }
    }
  ]
}
```

제목·연도·태그·목록 순서는 `data/projects.json`, 본문은 `contentFile`이 가리키는 파일 한 곳에서 관리하므로 같은 내용을 여러 파일에 복사하지 않습니다. `contentFile`과 이미지의 `src` 경로는 모두 사이트 루트를 기준으로 작성합니다.

#### `content` 배열 구조

콘텐츠는 **블록 배열**로, 다음 타입을 자유롭게 섞을 수 있습니다.

| 타입 | 필드 | 설명 |
|---|---|---|
| `"media"` | `items` 배열 | 한 행에 1~3개 이미지 |
| `"text"`  | `value` 객체 | 본문. `\n\n`으로 단락 구분, `**볼드**`로 강조 |
| `"embed"` | `src`, `title`, `aspectRatio`(선택) | 영상 임베드 URL과 제목. 기본 16:9, 최대 760px로 표시 |

단일 이미지 블록은 원본 비율로 전체를 표시합니다. 단일 이미지는 본문(최대 520px)보다 넓은 최대 760px로 가운데 정렬하고, 좁은 화면에서는 콘텐츠 영역 너비에 맞춥니다. 한 블록에 이미지 2~3개가 들어가면 16:9 프레임으로 맞추며, 비율이 다른 이미지는 일부가 잘릴 수 있습니다.

상세 페이지의 이미지를 클릭하거나 키보드로 선택해 Enter/Space를 누르면 원본 비율의 확대창이 열립니다. 이미지는 화면 해상도(Retina 포함)에 맞춰 원본 픽셀 이상으로 늘리지 않으며 최대 1200×900px와 화면 안쪽 영역으로 제한합니다. 이미지 바깥 영역·닫기 버튼·Esc로 닫을 수 있으며, 닫으면 원래 이미지로 키보드 포커스가 돌아갑니다. 영상은 임베드 서비스의 재생 컨트롤을 사용합니다.

확대창에서는 같은 글의 모든 이미지를 본문 순서대로 넘길 수 있습니다. 데스크톱에서는 커서가 좌우 가장자리에 가까워질 때 닫기 ×와 같은 22px 화살표가 표시됩니다. 키보드의 좌우 방향키도 지원하며, 모바일에서는 좌우 스와이프로 이동합니다. 처음·마지막 이미지에서는 해당 방향으로 더 이동하지 않습니다. 영상 임베드는 이미지 목록에 포함하지 않습니다.

이미지 아이템 형식:
```json
{ "type": "image", "src": "...", "alt": "선택" }
```

영상 임베드 블록 예시:
```json
{
  "type": "embed",
  "src": "https://player.vimeo.com/video/1236568096?badge=0&autopause=0",
  "title": "Draftie",
  "aspectRatio": "16 / 9"
}
```

- 서비스에서 제공하는 임베드 코드의 `iframe src` 주소를 `src`에 넣습니다. Vimeo 외에도 HTTPS iframe 임베드 주소를 같은 구조로 사용합니다.
- 일반 영상 공유 페이지 주소 대신 **플레이어 임베드 주소**를 사용합니다. HTML 태그나 별도 플레이어 스크립트는 JSON에 넣지 않습니다.
- `title`은 문자열 또는 `{ "en": "...", "ko": "..." }` 형식입니다.
- `aspectRatio`를 생략하면 `16 / 9`입니다. 세로 영상은 `9 / 16`, 정사각형은 `1 / 1`로 지정합니다.
- 특정 영상만 작게 표시하려면 `"maxWidth": 480`처럼 최대 너비(px)를 지정합니다. 생략하면 760px이며 좁은 화면에서는 화면에 맞춰 줄어듭니다.
- 영상은 독립된 `embed` 블록으로 추가합니다. `media.items`에는 이미지만 넣습니다.
- 호버용 썸네일이 필요하면 `data/projects.json` 또는 `data/writings.json`의 해당 목록 항목에 `thumbnail` 이미지 경로를 지정합니다.

#### `categories` 값
`graphic` · `editorial` · `web` · `product` · `workshop` · `installation` · `research`

새 카테고리를 추가하려면:
1. `js/state.js`의 `FILTERS` 배열에 추가
2. `data/ui.json`의 `filters` 객체에 한국어·영어 번역 추가

### ④ 저장하고 새로고침

---

## 3. Writings 글 추가

프로젝트와 같은 방식으로 목록 정보와 본문을 나눕니다.

1. `data/writings.json`에는 목록용 제목·연도·본문 파일 경로만 추가합니다. Writings는 태그를 사용하지 않습니다. 이 파일에 `content` 본문을 복사하지 않습니다. 배열 순서가 표시 순서입니다.

```json
{
  "id": "writings-2",
  "year": 2026,
  "title": {
    "en": "My New Essay",
    "ko": "새 글"
  },
  "contentFile": "data/writings/writings-2-my-new-essay.json"
}
```

2. `data/writings/writings-2-my-new-essay.json`에 같은 `id`와 `content`를 작성합니다.

```json
{
  "id": "writings-2",
  "content": [
    {
      "type": "text",
      "value": {
        "en": "First paragraph.\n\nSecond paragraph.",
        "ko": "첫 문단.\n\n두 번째 문단."
      }
    }
  ]
}
```

본문 파일명은 프로젝트처럼 `<id>-<영문제목>.json` 형식을 사용합니다. `content`의 이미지·텍스트·영상 임베드 블록 형식도 동일합니다. 현재 Another Audience 글의 본문은 `data/writings/writings-1-another-audience.json`입니다. 이미지는 `assets/images/writings/<article-id>/`에 두고, 경로는 사이트 루트를 기준으로 작성합니다.

> 상세 페이지는 `project.html?id=xxx&src=writings`로 자동 연결됩니다.

---

## 4. 노트 추가

`data/notes.json` 배열의 **맨 끝에** 새 객체를 추가합니다. 객체 하나가 흰색 문장 블록 하나입니다. 데이터는 오래된 것부터 저장하고, 화면에서는 역순으로 보여 새 블록이 맨 위에 쌓이고 기존 블록이 아래로 내려갑니다. 날짜 유무와 관계없이 추가한 순서대로 처리합니다.

```json
{
  "id": "note-2",
  "date": "2026-10-16",
  "body": {
    "en": "Text here. [Link label](https://example.com)\n\nNew paragraph.",
    "ko": "내용. **볼드**도 가능."
  }
}
```

기존 블록의 마지막 `}` 뒤에 쉼표를 붙이고, 배열의 닫는 `]` 앞에 위 객체를 넣으면 됩니다. `id`는 블록마다 다르게 지정합니다. `date`는 선택 사항이며 넣으면 흰색 블록 안에 표시합니다. 각 블록 사이 간격은 반응형 모눈 한 칸(`--grid-cell`)입니다.

- `\n\n` — 같은 블록 안에서 단락 나누기. 새 흰색 블록은 배열에 새 객체로 추가합니다.
- `**텍스트**` — 볼드
- `[라벨](URL)` — 하이퍼링크

---

## 5. 언어 / 폰트

한국어와 영어를 지원합니다: `ko` / `en`

사이트의 기본 진입 페이지는 영어 Work 목록(`index.html`)입니다. 새 탭에서 처음 접속하면 영어·전체 유형으로 시작하며, 선택한 언어와 필터는 현재 탭의 `sessionStorage`에 저장해 메뉴 이동과 새로고침 중에 유지합니다. 이전 방문의 `localStorage` 설정은 사용하지 않습니다.

| 언어 | 폰트 스택 |
|---|---|
| en | Merriweather → Times New Roman |
| ko | MerriweatherText(영문자·숫자) → Noto Serif KR(한글·특수문자) |

이전에 저장된 언어 설정이 더 이상 지원되지 않으면 영어로 전환하고 다시 저장합니다.

한국어 모드에서는 영문자·숫자는 Merriweather가 그대로 처리하고,
한글과 특수기호만 Noto Serif KR(Medium 500)로 렌더링됩니다.

자간은 선택한 언어와 관계없이 실제 한글에만 `-0.02em`을 적용합니다. 공용 텍스트 렌더러가 한글 부분을 자동으로 구분하므로 JSON은 그대로 작성하면 됩니다. 영문·숫자·공백·문장부호는 기본 자간을 유지합니다.

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
   - `assets/`를 먼저 업로드하고, JSON과 HTML을 마지막에 올립니다.
   - `assets/site/.htaccess`, `assets/optimized/.htaccess`도 포함합니다.
   - `.git/`, `scripts/`, `node_modules/`는 호스팅에 올리지 않습니다.
2. **SSL 활성화** — Hostinger 패널 → "SSL" → Free SSL 발급.
   `.htaccess`에서 자동 HTTPS 리다이렉트가 동작합니다.

### 업로드 후 확인
- [ ] `https://yourdomain.com/` — 프로젝트 목록 보임
- [ ] 언어 전환 (Ko / En) 정상 동작
- [ ] 필터 클릭 시 결과 갱신
- [ ] 프로젝트 클릭 → 상세 페이지 이동
- [ ] 모바일에서도 정상 보임
- [ ] 새 탭에서 처음 접속하면 영어 Work 목록 표시
- [ ] 메뉴 이동·새로고침 시 현재 탭에서 선택한 언어 유지 (sessionStorage)

---

## 8. 로컬 미리보기

ES Modules를 사용하므로 `file://`로 직접 열면 동작하지 않습니다.

**VS Code Live Server** — `index.html` 우클릭 → "Open with Live Server"

이미지 파일 감시로 반복 새로고침이 발생하는 것을 피하기 위해 `.vscode/settings.json`에서 `assets/images/**`를 Live Server 감시 대상에서 제외합니다. 이미지 교체 후에는 브라우저를 수동 새로고침합니다. HTML·CSS·JS·JSON 수정은 기존처럼 자동 반영됩니다. 설정을 처음 적용한 뒤에는 Go Live를 중지했다가 다시 실행합니다. 이 설정은 정적 호스팅에 영향을 주지 않습니다.

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

**Q. 프로젝트 설명을 수정하려면 어디를 열어요?**
`data/projects.json`의 해당 항목에서 `contentFile`을 확인하고 그 파일을 엽니다. 예를 들어 Draftie 본문은 `data/projects/project-2-draftie.json`입니다. 제목·연도·태그는 목록 파일에서 수정합니다.

**Q. Writings 본문을 수정하려면 어디를 열어요?**
`data/writings.json`의 `contentFile`에 지정된 `data/writings/` 안의 파일을 엽니다. 제목·연도·순서는 목록 파일에서 수정합니다.

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
- Fetch API + sessionStorage
- 빌드 도구 없음 — 수정 후 새로고침으로 즉시 반영

지원 브라우저: 최근 2년 이내 Chrome / Safari / Firefox / Edge (IE 미지원)

## 11. 성능과 표시 동작

- Notes 박스: 세로 여백 0.25em, 가로 여백은 검은 목록 블록과 같은 `--row-pad-x`, 줄간격 1.6, 문단 간격 0.5em.
- Notes 블록 높이도 격자 한 칸의 배수로 맞추며, 테두리가 모눈선에 겹치도록 배치합니다. 화면 너비·언어·폰트가 바뀌면 글 길이에 맞춰 다시 정렬합니다.
- Notes는 JSON 배열의 마지막 항목부터 보여 새 블록이 위로 쌓입니다. 날짜는 블록 안에 표시하고, 블록 사이 간격은 모눈 한 칸으로 유지합니다.
- Notes·CV·상세 본문은 각 문단이 화면에 들어오면 앞 문단의 완료를 기다리지 않고 독립적으로 작성됩니다. 작성된 줄만큼 아래 콘텐츠가 밀립니다. 같은 페이지에서 스크롤을 왕복해도 다시 실행하지 않고, 재방문(뒤로 가기 포함)하면 다시 실행합니다. 동작 줄이기 설정과 인쇄에서는 전체 글을 즉시 표시합니다. 속도는 `js/text-reveal.js`의 `CHARACTER_DELAY`로 조절합니다.
- CV는 `cv.html`에서 열리며, 문구는 `data/cv.json`에서 수정합니다. 기존 텍스트 블록 렌더러를 사용합니다.
- 페이지에 필요한 뷰 모듈만 불러옵니다.
- Work·Writings 목록은 각각 `data/projects.json`·`data/writings.json`을 불러옵니다. `contentFile`로 분리한 본문은 상세 페이지 진입 또는 목록 호버 시 필요한 파일만 읽고, 같은 페이지에서 반복 요청은 캐시합니다. 본문 로딩 실패는 다음 요청 때 다시 시도합니다.
- 같은 언어/필터를 다시 선택하면 저장과 렌더링을 생략합니다.
- 상세/Notes/Writings는 언어 변경에만 본문을 갱신합니다.
- Writings / 적어둔 것들. 탭은 `writings.html`이며, 목록은 `data/writings.json`, 글별 본문은 `data/writings/`에서 관리합니다. 상세 페이지는 `src=writings`로 구분합니다.
- Work의 Research 타입은 프로젝트의 `categories`에 `"research"`를 추가하면 적용됩니다.

### 모눈 정렬 규칙

- 각 breakpoint 안에서는 `--grid-cell`을 고정하며 JavaScript로 변경하지 않습니다.
- 배경 전체는 왼쪽 원점에서 동일한 정사각형 모눈을 반복합니다. 우측 전용 모눈이나 마스크는 사용하지 않습니다.
- 컨테이너 너비는 모눈 한 칸의 배수로 내림합니다. 블록 양끝은 모눈선에 맞고, 우측에는 한 칸과 창 끝에서 잘리는 부분 칸이 남을 수 있습니다. 고정된 정사각형과 정확한 한 칸 여백을 임의의 창 너비에서 동시에 보장하지 않습니다.
- 블록 높이와 블록 사이 간격은 세로 모눈의 정수 배수입니다. 글이 줄바꿈되면 필요한 높이까지 칸 단위로 늘어납니다.
- 모바일(720px 이하)은 18px 모눈, 검은 블록 좌우 8px·상하 최소 2px 여백을 사용합니다. 제목·태그의 줄간격은 1.6, 줄 사이 추가 간격은 0이며, 블록 높이는 18px 배수로 맞춥니다.
- `js/grid-alignment.js`가 너비 변경과 폰트 로딩 시 화면을 그리기 전에 정렬합니다. 별도 프레임의 높이 보정과 블록별 ResizeObserver는 사용하지 않습니다.
- 모눈 너비를 계산하거나 분배하는 JavaScript와 빈 우측 띠를 만들던 scrollbar-gutter 설정은 사용하지 않습니다.

### Work·Writings 호버 썸네일

프로젝트나 Writings 글에 호버하거나 제목 링크에 키보드 포커스를 주면 화면 중앙에 이미지가 표시되고 첫 문단은 흰색 카드로 함께 표시됩니다. 두 목록은 같은 회전·이동 효과를 사용하며, 레이어 순서는 이미지 → 모눈 → 목록 → 텍스트 카드입니다. 설명 카드는 `body`에 별도로 배치해 메뉴와 목록을 포함한 페이지 요소 위에 표시합니다.

- 기본값: 각 항목의 `content`에 있는 첫 이미지. 설명 카드는 첫 텍스트 문단을 사용하며, `contentFile`이 있으면 해당 본문 파일에서 읽습니다.
- 별도 지정: `data/projects.json` 또는 `data/writings.json`의 해당 목록 항목에 `thumbnail` 이미지 경로를 추가합니다.
- 이미지가 없는 프로젝트도 첫 문단이 있으면 텍스트 카드만 표시합니다.
- 썸네일은 호버할 때만 불러오며, 화면 가로·세로의 65%와 최대 840×640px 안에서 원본 비율을 유지합니다. 터치 입력에는 표시하지 않습니다.
- 이미지 로딩에 실패하면 다음 호버에서 다시 시도합니다. 성공한 이미지와 본문 요청은 캐시합니다.
- 이미지는 시계방향으로 400초에 한 바퀴, 텍스트 카드는 반시계방향으로 600초에 한 바퀴 회전합니다. 카드는 18초 주기로 최대 6px씩 떠다닙니다.
- 카드 위치는 호버마다 랜덤으로 정하되, 전체 회전의 대각선 길이와 이동 여유를 포함해 보이는 모눈 영역 안에 배치합니다. 좁은 화면에서는 카드 전체를 비율대로 축소하고, 리사이즈·스크롤·폰트 로딩 시 경계를 다시 계산합니다.
- 운영체제의 동작 줄이기 설정에서는 회전과 이동 애니메이션을 끕니다.

## 10. 로딩 성능과 배포 준비

2026-10-28: 정적 HTML 구조와 기존 디자인을 유지하면서 이미지 전송량과 페이지 이동 중 서버 왕복을 줄였습니다. URL·뒤로 가기·언어/필터 저장·확대창 동작은 동일합니다.

### 적용 방식

- **화면에 맞는 이미지**: `assets/optimized/`에 640 / 960 / 1600 / 2400px WebP를 생성하고, `srcset`으로 화면 크기와 픽셀 밀도에 맞는 파일을 선택합니다. 원본보다 크게 만들지 않습니다. 고해상도에서 더 큰 이미지가 필요하면 원본 후보도 제공합니다.
- **화질**: 사진은 WebP quality 92, 작은 글자가 많은 Draftie UI 캡처(`stillcut_5.png`, `stillcut_6.png`)는 리사이즈 이후 무손실 인코딩입니다. 확대창은 항상 `assets/images/`의 원본을 사용합니다. 원본 파일과 콘텐츠 JSON은 변경하지 않았습니다.
- **이미지 표시 순서**: 첫 블록이 이미지이면 즉시 요청하고 첫 이미지에 높은 우선순위를 줍니다. 나머지는 지연 로딩합니다. 가로·세로 크기로 자리를 미리 확보합니다. 호버 썸네일도 화면·배율에 맞는 파일만 요청합니다.
- **안전한 장기 캐시**: HTML·JSON은 기존 `no-cache`로 서버에 최신 여부를 확인합니다. 배포용 JS/CSS는 `assets/site/<내용 해시>/`, WebP는 파일명 해시로 구분하고 1년 캐시합니다. 소스를 바꾸면 새 주소를 만들므로 오래된 파일이 업데이트를 가리지 않습니다. Service Worker나 별도 저장소 캐시는 추가하지 않았습니다.
- **초기 요청 병렬화**: 필요한 모듈은 HTML의 `modulepreload`로 조기에 발견하고, UI 번역·페이지 JSON·뷰 모듈을 병렬로 가져옵니다. 같은 문서 안에서는 JSON 요청을 공유하며 실패한 요청은 다시 시도할 수 있습니다.
- **폰트 유지**: 기존 Google Fonts의 동일한 서체·굵기·unicode 범위 정의를 `css/fonts.css`에 보관합니다. 배포 CSS와 합쳐 `fonts.googleapis.com`의 렌더링 차단 요청을 제거합니다. 폰트 파일은 기존 `fonts.gstatic.com`에서 필요한 문자 범위만 받습니다. 서체를 변경할 때는 이 파일도 갱신합니다.

SPA 전환·Service Worker·전체 페이지 사전 다운로드는 변경 범위와 캐시 무효화 복잡도가 더 커서 적용하지 않았습니다. 원본 전체를 압축해 덮어쓰는 방식도 확대 시 화질 보존 조건에 맞지 않습니다. 캐시와 반응형 이미지의 표준 동작은 [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), [web.dev Responsive images](https://web.dev/learn/design/responsive-images)를 기준으로 검토했습니다.

### 수정할 때 실행하는 명령

**Notes·글·프로젝트 JSON만 수정**: 기존처럼 해당 JSON을 저장하고 업로드합니다. 추가 명령은 없습니다.

**JS 또는 CSS 수정**: 원본은 `js/`, `css/`에서 수정한 뒤 아래를 실행합니다. Python 3 표준 라이브러리만 사용합니다.

```bash
python3 scripts/prepare-site.py
```

생성된 `assets/site/`와 변경된 HTML을 함께 업로드합니다. 생성된 JS/CSS를 직접 수정하면 안 됩니다. 로컬 미리보기 역시 이 명령 후 새로고침합니다. 열린 탭과 캐시된 문서를 위해 이전 버전 디렉터리는 자동 삭제하지 않습니다.

**이미지 추가/교체 후 최적화**: Node.js와 sharp가 필요합니다. 최초 한 번 의존성을 설치합니다.

```bash
npm install --prefix scripts
node scripts/optimize-images.cjs
python3 scripts/prepare-site.py
```

`assets/optimized/`, `assets/site/`, HTML과 새 원본을 업로드합니다. 작은 UI 글자 위주의 새 이미지라면 `scripts/optimize-images.cjs`의 `losslessImages`에 경로를 추가합니다. 기존 원본을 교체할 때는 새 파일명으로 저장하고 JSON의 `src`도 변경합니다(기존 원본 URL은 6개월 캐시). 최적화본이 아직 없는 새 이미지는 자동으로 원본을 표시하므로 JSON 편집만으로 추가하는 기존 흐름도 유지됩니다.

### 확인 결과와 한계

로컬 Apache에서 실제 `.htaccess`를 적용하고 Chrome으로 3회 비교했습니다. 데스크톱 1440×1000, DPR 2, 지연 100ms, 다운로드 10Mbps 조건이며 외부 폰트·Vimeo 요청은 양쪽에서 제외했습니다. 수치는 탐색 시작부터 콘텐츠가 보일 때까지의 중앙값입니다. 실제 운영 서버의 Core Web Vitals 점수나 실제 방문자의 보장 속도는 아닙니다.

| 동작 | 변경 전 | 변경 후 |
|---|---:|---:|
| 첫 Work 목록 | 1.25초 | 0.57초 |
| Notes 이동 | 0.74초 | 0.33초 |
| Writings 이동 | 1.24초 | 0.33초 |
| Another Audience 첫 이미지 디코딩 완료 | 6.50초 | 0.88초 |
| Work 목록 재방문 | 1.24초 | 0.32초 |

데스크톱·모바일(DPR 3)에서 목록 호버, 메뉴 이동, 언어 유지, 전체 프로젝트 이미지 로딩, 원본 확대·방향키·닫기·포커스 복귀, 없는 ID 오류 표시, 가로 넘침을 검증했습니다. 원본 이미지 17개의 바이트가 모두 유지됨을 확인했고, 배포 준비 명령을 재실행해도 결과가 바뀌지 않았습니다. UI 캡처 2장은 같은 크기로 리사이즈한 원본과 WebP의 디코딩 픽셀이 완전히 같았고, 사진은 같은 크기의 비교 이미지를 육안 확인했습니다.

대표 이미지의 1600px 파일 기준: Another Audience 표지 5,771,087→310,870바이트(94.6% 감소), Welcome Kit 표지 1,480,626→203,176바이트(86.3% 감소), Draftie UI 캡처 2,042,882→456,346바이트(77.7% 감소). 브라우저가 고르는 크기에 따라 실제 전송량은 달라집니다. 변형본을 추가하므로 서버 저장 공간은 늘지만, 방문자는 필요한 크기 하나만 받습니다.

배포 뒤에는 개발자 도구 Network에서 `assets/site/`와 `assets/optimized/`의 `Cache-Control: public, max-age=31536000, immutable`, HTML·JSON의 `Cache-Control: no-cache`를 확인합니다. Hostinger/CDN의 별도 캐시 규칙이 이를 덮어쓰는 경우 호스팅 설정 확인이 필요합니다.
