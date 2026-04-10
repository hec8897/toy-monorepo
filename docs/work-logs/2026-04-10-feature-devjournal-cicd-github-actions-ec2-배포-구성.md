# 2026-04-10 feature/devjournal-cicd 작업 일지

## 📋 작업 개요

- **브랜치**: feature/devjournal-cicd
- **작업 일자**: 2026-04-10
- **목적**: DevJournal 백엔드 CI/CD 파이프라인 구성 (GitHub Actions + EC2)

## ✅ 완료된 작업

- GitHub Actions CI workflow 작성 (PR 시 lint/build 검사)
- GitHub Actions 배포 workflow 작성 (develop 머지 시 EC2 자동 배포)
- PM2 ecosystem.config.js 작성
- EC2 인스턴스 초기 세팅 (Node.js 22, pnpm, PM2)
- EC2 `/home/ubuntu/devjournal-backend/` 디렉토리 및 .env 파일 구성
- GitHub Secrets 등록 (DEVJOURNAL_EC2_HOST, DEVJOURNAL_EC2_USERNAME, DEVJOURNAL_EC2_SSH_KEY, DEVJOURNAL_EC2_PORT)

## 🔧 주요 변경사항

| 파일 | 변경 내용 |
| ---- | --------- |
| `.github/workflows/ci-devjournal.yml` | PR → develop 시 lint/build 검사 |
| `.github/workflows/deploy-devjournal-backend.yml` | develop 머지 시 EC2 자동 배포 |
| `apps/devjournal/backend/ecosystem.config.js` | PM2 프로세스 설정 |

## 🐛 발생한 문제 & 해결

- 없음

## 💡 기술적 결정사항 (왜 이 방법을 선택했는가)

- **빌드를 CI 서버에서 수행**: t2.micro(1GB RAM)에서 NestJS webpack 빌드 시 메모리 부족 우려 → CI 서버에서 빌드 후 `main.js`만 EC2에 SCP로 전달
- **GitHub Secrets prefix**: 향후 서비스 추가 시 Secret 충돌 방지를 위해 `DEVJOURNAL_` prefix 적용
- **paths 필터**: 관련 없는 변경에 CI/CD가 트리거되지 않도록 `apps/devjournal/backend/**` 경로 필터 적용
- **dev/prod 분리 전략**: 현재는 EC2 1대를 dev 환경으로 운영, 실서비스 시 prod 인스턴스 별도 추가 예정

## 🔗 관련 이슈/참고

- EC2: Ubuntu 24.04, t2.micro (ap-southeast-2)
- 배포 방식: GitHub Actions → SCP(main.js) → SSH(PM2 reload)
