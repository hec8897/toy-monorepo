# 2026-04-11 fix/devjournal-mixed-content-api-proxy 작업 일지

## 📋 작업 개요

- **브랜치**: fix/devjournal-mixed-content-api-proxy
- **작업 일자**: 2026-04-11
- **목적**: Vercel 배포 환경에서 EC2 백엔드 API 호출 시 발생하는 mixed-content 에러 해결

## ✅ 완료된 작업

- Vercel rewrites를 통한 API 프록시 설정
- httpClient baseURL 분기 처리 (배포 vs 로컬)

## 🔧 주요 변경사항

| 파일                                                    | 변경 내용                             |
| ------------------------------------------------------- | ------------------------------------- |
| `apps/devjournal/frontend/next.config.js`               | `/api/*` → EC2 URL rewrites 추가      |
| `apps/devjournal/frontend/src/shared/lib/httpClient.ts` | 배포 환경에서 baseURL을 `/api`로 변경 |

## 🐛 발생한 문제 & 해결

- **문제**: Vercel(HTTPS)에서 EC2(HTTP)로 직접 API 요청 시 브라우저가 `blocked:mixed-content`로 차단
- **해결**: Vercel rewrites 기능을 활용해 `/api/*` 요청을 Vercel 서버에서 EC2로 프록시 처리 → 브라우저 입장에서는 HTTPS 요청만 발생

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- EC2에 SSL 인증서를 붙이는 대신 Vercel rewrites 프록시 방식 선택
  - EC2 도메인 없이도 즉시 해결 가능
  - EC2 IP가 클라이언트에 노출되지 않아 보안에도 유리
- 로컬 개발에서는 `NEXT_PUBLIC_API_URL` 직접 사용 (rewrites는 Vercel 서버에서만 동작)

## 🔗 관련 이슈/참고

- 배포 URL: https://devjournal-hec8897s-projects.vercel.app
- EC2 API URL은 Vercel 환경변수 `NEXT_PUBLIC_API_URL`에 설정
