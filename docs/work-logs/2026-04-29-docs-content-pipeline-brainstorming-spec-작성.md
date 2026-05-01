# 2026-04-29 docs/content-pipeline-brainstorming-spec 작업 일지

## 📋 작업 개요

- **브랜치**: `docs/content-pipeline-brainstorming-spec` (base: `develop`)
- **작업 일자**: 2026-04-29
- **목적**: 2차 프로토타입(콘텐츠 자동화 파이프라인 SaaS) brainstorming spec 작성. 컨셉 → 인프라 → AI 인터뷰 흐름 설계까지 정리. plan 단계 진입 전 핵심 결정 확정용.

## ✅ 완료된 작업

### 1차 커밋 (`f96d00c`) — 컨셉 + 인프라 brainstorming

- 컨셉: 한 줄 가치 명제, 핵심 차별점 3가지, 타겟 페르소나, Aha 시나리오 정의
- 자동화 흐름: 주제 → 인터뷰 → 양산 → 편집 → 발행 큐 → 채널 발행
- 발행 채널: 네이버(메일 트릭) + 인스타(Meta Graph API, Development Mode)
- n8n internal pattern: 우리 앱 = SoT, n8n = replaceable 실행 엔진
- Solid+ MVP 스코프 (Phase 1~8, 예상 17~22일)
- 인프라 결정: ECS Fargate + ECR, public subnet only, n8n은 Cloudflare Access(B안)
- 채택 안 한 후보들(Docker Compose / ECS on EC2, n8n A/C안)도 비교표로 메모

### 2차 커밋 (예정) — AI 인터뷰 흐름 설계

- 인터뷰 위상: skippable 기본 경로 (A안)
- 질문 생성 전략: 매 턴 동적 LLM 호출 (A안)
- 종료 조건: 하이브리드 — 최소 3개 + AI 판단 + 사용자 "그만" + 최대 8개 (D안)
- UX 패턴: Typeform-like wizard, 진행률 표시 (B안)
- 사용자 통제권: 단방향 진행 + 종료 후 리뷰 화면 편집 (B안)
- 답변 형태: 텍스트만, 사진 첨부는 주제 입력 단계 한정 (A안)
- 채택 안 한 후보들도 비교표로 메모
- prompt 디테일/데이터 스키마/에러 처리는 plan 단계로 이관

## 🔧 주요 변경사항

| 파일                                                                         | 변경 내용                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/superpowers/specs/2026-04-28-content-pipeline-saas-design.md`          | brainstorming spec 신규 작성 (388 lines) → 인프라/인터뷰 설계 추가 |
| `docs/work-logs/2026-04-29-docs-content-pipeline-brainstorming-spec-작성.md` | 본 작업 일지                                                       |

### 스펙 문서 구조

- 1~5절: 컨셉 / 타겟 / 시나리오 / 자동화 흐름 / 발행 채널
- 6절: n8n internal pattern (SoT 원칙)
- 6.5절: Solid+ MVP 스코프 (Phase 1~8)
- 6.6절: 인프라 / 배포 — ECS Fargate + ECR, n8n Cloudflare Access
- **6.7절: AI 인터뷰 흐름 설계** (신규)
- 7절: 기술 스택 결정
- 7.5절: plan 단계 / 후속 사이클로 미룬 결정
- 8절: 결정 이력 (날짜별)
- 9절: 1차 프로토타입과의 연결

## 🐛 발생한 문제 & 해결

- 없음 (문서 작성 작업)

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

### ECS Fargate + ECR 채택

- **학습 가치 최대화**: Docker + ECR + Task Definition + ALB + IAM execution role 전부 경험
- **"껐다 켰다" 비용 모델**: Fargate는 desired count = 0 시 컴퓨팅 비용 = $0 (EC2와 달리 EBS 잔존 X)
- **1차와 깨끗한 분리**: 1차 devjournal-backend는 PM2 직접 배포라 Docker 미사용. 2차는 처음부터 컨테이너 워크플로우
- **fallback 명시**: Cloudflare Access 셋업 막힐 시 옵션 A(Basic Auth) 임시 대안

### AI 인터뷰: 매 턴 동적 LLM

- "AI 인터뷰형 인풋"이 컨셉의 핵심 차별점 → 가장 강한 형태로 구현해야 컨셉이 살아남
- 미리 만든 템플릿이면 "AI 인터뷰" 흉내일 뿐
- 답변 짧으면 "조금 더 풀어주세요", 풍부하면 "그 부분 더 파고들면..." 같은 진짜 대화 가능

### 단방향 + 종료 후 리뷰

- 매 턴 동적 LLM 환경에서 양방향(이전 버튼)은 궁합 안 좋음 — 이전 답변 수정 시 이후 질문 폐기/재생성 필요 (LLM 호출 낭비 + 사용자 혼란)
- 종료 후 리뷰 화면이 안전망 역할 충분
- 양산 LLM은 비용 큰 호출 → 양산 직전 한 번에 정확히 하는 게 합리적

### 사진 첨부는 주제 입력 단계 한정

- Gemini 2.5 Flash 멀티모달이 사진 보고 인터뷰 출발점 풍부하게 만듦 (가치 ↑)
- 인터뷰 답변/양산 출력에 끌어들이면 스코프 ↑↑ (이미지 호스팅, HTML→Image 합성, 저작권 등)
- 6.5절 "텍스트만, 단색 배경" 결정과 일관성 유지

## 🔗 관련 이슈/참고

- **다음 단계**: AI 양산 산출물 품질 정의 → 편집기 UX → 인풋 옵션 → 발행 에러 시나리오 → MVP 검증 기준 → 인증/온보딩 (이후 별도 사이클)
- **plan 단계로 이관**: 시스템 아키텍처 디테일, DB 스키마, API 라우트, n8n 워크플로우 페이로드, 인증 구현 방식, 카드뉴스 렌더 라이브러리, 인스타 캐러셀 발행 디테일, 인터뷰 prompt 설계
- **3차 이후**: Tistory 자동 발행, Meta App Review, 결제, 카드뉴스 비주얼 고도화, 멀티 유저 onboarding UX
