# 2026-04-11 fix/devjournal-mixed-content-api-proxy 작업 일지

## 📋 작업 개요

- **브랜치**: fix/devjournal-mixed-content-api-proxy
- **작업 일자**: 2026-04-12
- **목적**: Vercel 배포 환경에서 EC2 백엔드 API 호출 시 발생하는 mixed-content 에러 및 서버 IP 노출 문제 근본 해결

## ✅ 완료된 작업

- Next.js rewrites를 통한 서버사이드 API 프록시 설정
- `BACKEND_URL` 환경변수 분리 (서버사이드 전용, 클라이언트 번들 미포함)
- `NEXT_PUBLIC_API_URL`을 상대 경로(`/devjournal-api`)로 변경
- httpClient.ts 불필요한 runtime 환경 분기 제거
- Vercel 환경변수 설정 (`NEXT_PUBLIC_API_URL`, `BACKEND_URL`)

## 🔧 주요 변경사항

| 파일                                                    | 변경 내용                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `apps/devjournal/frontend/next.config.js`               | rewrites source `/devjournal-api/:path*` → `BACKEND_URL/api/:path*`로 변경 |
| `apps/devjournal/frontend/src/shared/lib/httpClient.ts` | runtime 환경 분기 제거, `NEXT_PUBLIC_API_URL` 단일 사용                    |
| `apps/devjournal/frontend/.gitignore`                   | `.vercel` 디렉토리 gitignore 추가 (Vercel CLI 연동)                        |

## 🐛 발생한 문제 & 해결

- **문제 1**: `blocked:mixed-content` — Vercel(HTTPS)에서 EC2(HTTP)로 직접 API 요청 시 브라우저 차단
- **문제 2**: EC2 IP(`http://3.107.105.164:3002`)가 클라이언트 JS 번들에 하드코딩되어 노출
- **해결**: Next.js rewrites로 브라우저→Vercel(`/devjournal-api/*`)→EC2(`BACKEND_URL/api/*`) 프록시 구성
  - 브라우저는 항상 HTTPS same-origin 요청만 발생 → mixed-content 해결
  - EC2 IP는 서버사이드 환경변수 `BACKEND_URL`에만 존재 → 클라이언트 번들 미포함

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **`BACKEND_URL` vs `NEXT_PUBLIC_API_URL` 분리 이유**
  - 초기 구현은 `NEXT_PUBLIC_API_URL`에 EC2 IP를 설정했으나, `NEXT_PUBLIC_*` 변수는 빌드 타임에 클라이언트 번들에 삽입됨
  - `BACKEND_URL`(prefix 없음)은 서버사이드에서만 접근 가능 → IP 완전 은닉
  - `NEXT_PUBLIC_API_URL=/devjournal-api`(상대 경로)는 모든 환경에서 동일하게 사용

- **`/devjournal-api` prefix 선택 이유**
  - `/api`는 Next.js Route Handler와 충돌 가능성 있음
  - 명시적 prefix로 백엔드 API 경로임을 명확히 구분

- **Vercel rewrites 방식 선택 이유** (EC2 SSL 인증서 대신)
  - 도메인 없이 즉시 해결 가능
  - Vercel→EC2 구간은 서버간 HTTP 통신이므로 mixed-content 규칙 미적용

## 🔗 관련 이슈/참고

- 배포 URL: https://devjournal-beta.vercel.app
- Vercel 환경변수: `NEXT_PUBLIC_API_URL=/devjournal-api`, `BACKEND_URL=http://3.107.105.164:3002`
