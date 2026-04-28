# 2026-04-28 feature/devjournal-day14-dashboard 작업 일지

## 📋 작업 개요

- **브랜치**: `feature/devjournal-day14-dashboard`
- **작업 일자**: 2026-04-28
- **목적**: Day 14 대시보드 PR #73의 미해결 이슈 마무리 (WeeklyHeatmap 버그 수정 + 색상 표시 이슈 해결)

## ✅ 완료된 작업

- WeeklyHeatmap **최신 날짜 누락 버그** 수정
  - `buildCalendar`를 "오늘 = 마지막 셀(가장 오른쪽 열의 오늘 요일 칸)" 기준으로 역방향 채우기로 변경
  - 이전 구현은 가장 오래된 날짜를 첫 열에 두고 첫 열에 placeholder를 채우는 방식 → 결과적으로 최신 N일이 그리드 슬롯 부족으로 누락
- 디버그용 `console.log` 3곳 제거 (`getCellColor`, `WeeklyHeatmap` 본문, 셀 매핑 내부)
- WeeklyHeatmap **emerald 색상 미표시 이슈** 해결 확인 — 화면에서 셀 색상이 정상 노출됨
- `.gitignore`에 `.superpowers/` 로컬 디렉토리 추가

## 🔧 주요 변경사항

| 파일                                                                            | 변경 내용                                                      |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/devjournal/frontend/src/domains/dashboard/presentation/WeeklyHeatmap.tsx` | `buildCalendar` 역방향 채우기로 재작성, `console.log` 3곳 제거 |
| `.gitignore`                                                                    | `.superpowers/` 추가                                           |

## 🐛 발생한 문제 & 해결

### 문제 1. WeeklyHeatmap 최신 날짜가 그리드에 표시 안 됨

- **증상**: 오늘 근처 N일이 비어있고 90일 전부터의 데이터만 그려짐
- **원인**: `buildCalendar`가 가장 오래된 날짜의 요일에 맞춰 첫 열을 placeholder로 채우는 구조였음. 91일 데이터 + 91 슬롯(7×13)에서 첫 열 placeholder만큼 슬롯이 줄어들어, 실제 채워질 때 cells 배열의 **뒷부분(최신 N일)이 잘려나감**
- **해결**: 채우는 방향을 반전. 오늘을 `(row=todayWeekday, col=12)`에 두고 cellIdx를 `cells.length - 1`부터 감소시키며 역방향으로 채움. 마지막 열에서 오늘 이후 요일은 placeholder로 남김 (GitHub 컨트리뷰션 그래프 스타일)
- **트레이드오프**: 슬롯 수가 같으니 가장 오래된 며칠은 잘릴 수 있음 → 사용자와 협의 후 그대로 유지 (최신 날짜 노출이 우선)

### 문제 2. WeeklyHeatmap emerald 색상이 화면에 표시 안 됨 (이전 PR 미해결 이슈)

- **상태**: 해결 완료. 화면에서 셀 색상이 정상적으로 단계별로 노출됨

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **HEATMAP_COLS을 14로 늘리지 않고 13 유지**: 데이터 표시량(91일)을 그대로 유지하기보단, 사용자 의사 결정에 따라 "최신 날짜 보장"을 우선. 이전 며칠 누락은 시각적으로 영향이 거의 없음
- **역방향 채우기 채택**: GitHub 컨트리뷰션 그래프와 동일한 사용자 멘탈 모델 → 우측 끝이 "오늘"이라는 직관과 일치
- **마지막 열 미래 요일 placeholder 처리**: 오늘이 화/수 같은 평일이면 우측 상단 일부 칸이 비어 보이는데, 이는 의도된 동작 (미래 날짜는 표시 X)

## 🔗 관련 이슈/참고

- 관련 PR: #73 `feat(devjournal): Day 14 — Dashboard KPI + ConceptGrowthChart + WeeklyHeatmap`
- 이전 작업 일지: `docs/work-logs/2026-04-27-feature-devjournal-day14-dashboard.md`
- 컴포넌트: `apps/devjournal/frontend/src/domains/dashboard/presentation/WeeklyHeatmap.tsx`
