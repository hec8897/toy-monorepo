# 2026-04-23 feature/devjournal-tiptap-editor 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-tiptap-editor`
- **작업 일자**: 2026-04-23
- **목적**: Day 11 — 일기 작성 UI를 `textarea`에서 Tiptap v2 에디터로 교체. 마크다운 저장 방식으로 BE/DB/Gemini 분석 파이프라인 무변경. 상세 페이지는 `marked` + `DOMPurify`로 HTML 렌더.

## ✅ 완료된 작업

- `TiptapEditor` 컴포넌트 신규 구현 (StarterKit + CodeBlockLowlight + Underline + Link + Markdown 확장)
- 툴바 버튼 10개 추가: `H2`, `H3`, `B`, `I`, `U`, `🔗`, `` ` ``, `{}`, `•`, `1.`
- `JournalForm` 리팩토링 — textarea 제거, TiptapEditor 사용. 글자수는 plain text 기준
- `EntryContent` 리팩토링 — plain text → 마크다운 HTML 렌더 (`marked` + `DOMPurify`)
- `global.css` — `.ProseMirror` / `.prose` 공통 타이포 + highlight.js 토큰 색상 (github-dark 계열)
- `tailwind.config.ts` — content 스캔 경로에 `src/domains/**` 추가
- 패키지 추가: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-underline`, `@tiptap/extension-link`, `tiptap-markdown`, `lowlight`, `marked`, `dompurify`, `@types/dompurify`

## 🔧 주요 변경사항

| 파일                                                | 변경 내용                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `frontend/presentation/components/TiptapEditor.tsx` | 🆕 신규 — 에디터 + 10버튼 툴바, Markdown 입출력                        |
| `frontend/presentation/components/JournalForm.tsx`  | textarea → TiptapEditor, plain text 글자수 검증                        |
| `frontend/presentation/components/EntryContent.tsx` | marked + DOMPurify 마크다운 HTML 렌더                                  |
| `frontend/src/app/global.css`                       | `@layer components` 내 `.ProseMirror`/`.prose` 타이포 + hljs 토큰 색상 |
| `frontend/tailwind.config.ts`                       | content 경로에 `src/domains/**` 추가                                   |
| `package.json` / `pnpm-lock.yaml`                   | Tiptap/lowlight/marked/dompurify 의존성 추가                           |

## 🐛 발생한 문제 & 해결

- **툴바 버튼 클릭 시 노드 변환(Heading/List/CodeBlock)이 동작하지 않음**: 버튼 `mousedown`에서 브라우저 기본 동작으로 포커스가 이동하며 selection이 유실, `chain().focus()`가 복구해도 노드 변환 커맨드는 유효 selection이 없어 no-op. 모든 툴바 버튼에 `onMouseDown={(e) => e.preventDefault()}` 추가해 포커스 이탈 자체를 차단.
- **코드블록/리스트/헤딩에 스타일 미적용**: Tailwind v4 Preflight(`@layer base`)가 `ul/ol/h2/h3` 등을 리셋하는데, 커스텀 룰을 unlayered로 작성하면 Next.js PostCSS 처리 순서에 따라 의도대로 override되지 않음. 커스텀 CSS 전체를 `@layer components`로 감싸 Preflight(base)보다 높은 우선순위 보장.
- **툴바 유틸리티 클래스 미생성 우려**: `TiptapEditor.tsx`가 `src/domains/` 하위인데 `tailwind.config.ts`의 `content`에서 누락. JIT 대상에 `./src/domains/**/*.{js,ts,jsx,tsx,mdx}` 추가.
- **`tiptap-markdown` Storage 타입 미확장**: `editor.storage.markdown.getMarkdown()` 호출 시 TS 2339. 로컬 `MarkdownStorage` 타입 + 헬퍼 함수로 캐스팅.
- **React 19 `FormEvent` deprecated 경고**: `handleSubmit` 선언식을 제거하고 `onSubmit` 인라인 arrow 함수로 이동. 타입 추론으로 해결.

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **옵션 A: 마크다운 저장**: Tiptap 출력을 마크다운 문자열로 직렬화해 기존 `entries.content: text` 컬럼 그대로 재사용. BE DTO / Gemini 분석 파이프라인 / DB 스키마 전부 무변경. HTML/JSON 저장 방식 대비 가장 적은 블라스트 레이디어스.
- **Underline은 HTML 인라인(`<u>`) 저장**: 표준 마크다운 문법이 없어 `tiptap-markdown`이 `<u>` 인라인 태그로 직렬화. `marked`는 기본적으로 HTML 인라인 허용, DOMPurify allowlist 기본값에 포함 → 별도 설정 불필요.
- **Link는 `window.prompt` 미니멀 방식**: 팝오버/모달 구현 분량을 Day 11 범위 밖으로 밀고 빠르게 작동하는 형태 우선. 필요 시 추후 개선.
- **하이라이팅 테마를 패키지 설치 대신 인라인 CSS로 작성**: `highlight.js/styles/*.css` import를 추가 의존성으로 두지 않고 `@layer components`에 최소 토큰 색상만 직접 작성. 번들 사이즈 절감.
- **`prose` 클래스 유지**: Tailwind Typography 플러그인이 설치되어 있지 않아도 `.prose`는 내 커스텀 셀렉터 진입점으로만 사용. 추후 typography 플러그인 도입 시 자연스럽게 승계 가능.

## 🔗 관련 이슈/참고

- Day 10 작업: `2026-04-22-feature-devjournal-day10-sse-search-connections.md`
- 계획서 Day 11 항목: `docs/devjournal-plan.md` — `textarea → Tiptap v2 교체 + SSE 실시간 분석 연동`
- SSE 분석 파이프라인은 상세 페이지(`EntryDetailPageView.tsx`)에 이미 연결되어 있어 이번 작업 범위에선 추가 변경 없음.
