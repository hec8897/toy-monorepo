# 2026-04-11 hotfix/security-audit-fix 작업 일지

## 📋 작업 개요

- **브랜치**: `hotfix/security-audit-fix`
- **작업 일자**: 2026-04-11
- **목적**: `pnpm audit`으로 발견된 high/critical 보안 취약점 해결

## ✅ 완료된 작업

- `vite` 취약점 2개 해결 (High): server.fs.deny 우회, WebSocket 임의 파일 읽기
- `axios` 취약점 3개 해결 (Critical × 2, High × 1): SSRF, 클라우드 메타데이터 탈취, DoS
- `minimatch` 취약점 해결 (High): ReDoS
- `picomatch` 취약점 해결 (High): ReDoS via extglob quantifiers
- `lodash` 취약점 해결 (High): Code Injection via \_.template

## 🔧 주요 변경사항

| 파일             | 변경 내용                                                                       |
| ---------------- | ------------------------------------------------------------------------------- |
| `package.json`   | `pnpm.overrides` 추가: vite, axios, minimatch, picomatch, lodash 버전 강제 고정 |
| `pnpm-lock.yaml` | 보안 패치 버전으로 의존성 재생성                                                |

## 🐛 발생한 문제 & 해결

- **문제**: `pnpm-workspace.yaml`의 `overrides` 필드에 버전 범위를 키로 사용하는 형식(`vite@>=8.0.0 <=8.0.4: '>=8.0.5'`)이 실제로 pnpm에 적용되지 않음
- **원인**: pnpm의 workspace overrides는 해당 형식을 지원하지 않아 lockfile에 반영되지 않음
- **해결**: `package.json`의 `pnpm.overrides` 필드에 올바른 형식으로 override 추가 후 lockfile 재생성

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- `pnpm.overrides`를 사용하여 직접 설치 없이 하위 의존성을 강제 고정하는 방식 채택
- **버전 범위 키 형식** 사용 필수: `"minimatch": ">=9.0.7"`처럼 패키지 이름만 쓰면 v3.x 등 다른 major 버전까지 강제 업그레이드되어 `eslint-plugin-import@2.32.0`(minimatch@^3 의존)가 깨짐
- 대신 `"minimatch@>=9.0.0 <9.0.6": "9.0.7"` 형식으로 취약 버전 범위만 한정하여 패치
- 해결 후 `file-type` moderate 취약점 2개가 남아 있으나, `@swc/cli` 의존성 체인에서 호환 가능한 버전이 없어 override 불가 → high 이상만 목표였으므로 범위 외

## 🔗 관련 이슈/참고

- GHSA-v2wj-q39q-566r (vite server.fs.deny 우회)
- GHSA-p9ff-h696-f583 (vite WebSocket 파일 읽기)
- GHSA-3p68-rc4w-qgx5 (axios SSRF)
- GHSA-fvcv-3m26-pcqx (axios 클라우드 메타데이터 탈취)
- GHSA-43fc-jf86-j433 (axios DoS)
- GHSA-3ppc-4f35-3m26 (minimatch ReDoS)
- GHSA-c2c7-rcm5-vvqj (picomatch ReDoS)
- GHSA-r5fr-rjxr-66jc (lodash Code Injection)
