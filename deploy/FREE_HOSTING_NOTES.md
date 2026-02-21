# 무료 배포 선택 요약

## Docker Compose (추천)

- 대상: Oracle Always Free VM, GCP e2-micro, AWS Lightsail trial 등 VM
- 장점: 현재 코드(Express + Python worker + SQLite) 그대로 실행
- 단점: VM 관리 책임이 있음

## GitHub Pages

- 대상: 정적 웹 UI만
- 장점: 무료/간단
- 단점: 백엔드 실행 불가 (Node/Python 프로세스 없음)

## 결론

이 프로젝트는 백엔드 판정 워커가 필요하므로 무료 운영은 VM 계열이 맞고,
`웹 UI는 GitHub Pages`, `API는 VM` 분리 운영이 현실적입니다.
