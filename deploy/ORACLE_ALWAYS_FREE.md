# Oracle Always Free 배포 가이드

이 프로젝트는 Docker Compose로 Oracle Always Free VM에 배포 가능합니다.

## 왜 Oracle Always Free?

- VM을 무료로 장기 운영 가능 (조건 충족 시)
- Docker Compose 기반 앱/워커/DB 파일 운영에 적합
- GitHub Pages와 달리 백엔드 프로세스를 직접 실행 가능

## 주의 사항 (공식 정책)

Oracle은 Always Free 리소스가 7일 이상 유휴 상태(예: CPU/메모리/네트워크 사용량 기준 미달)면 회수할 수 있습니다.
운영 중 트래픽이 매우 낮으면 회수될 수 있으니 모니터링이 필요합니다.

## 1) VM 생성

1. Oracle Cloud Free Tier 가입
2. `Compute -> Instances -> Create instance`
3. Ubuntu 22.04/24.04 선택
4. 공인 IP 활성화
5. SSH 키 등록
6. 네트워크 보안 규칙에서 최소 포트 오픈
- `22/tcp` (SSH)
- `8080/tcp` (앱 직접 노출 시)

## 2) 서버 초기 설치

로컬에서:

```bash
scp deploy/oracle_vm_install.sh ubuntu@<VM_PUBLIC_IP>:~/
ssh ubuntu@<VM_PUBLIC_IP> 'bash ~/oracle_vm_install.sh'
```

설치 후 한 번 재로그인:

```bash
ssh ubuntu@<VM_PUBLIC_IP>
```

## 3) 앱 배포

```bash
scp deploy/oracle_vm_deploy.sh ubuntu@<VM_PUBLIC_IP>:~/
ssh ubuntu@<VM_PUBLIC_IP> 'bash ~/oracle_vm_deploy.sh <YOUR_GIT_REPO_URL> main'
```

예:

```bash
ssh ubuntu@<VM_PUBLIC_IP>
cd ~/ai_md_community
cp .env.example .env
nano .env
# CORS_ORIGIN, DB_DRIVER 등 환경값 수정
docker compose up -d --build
```

## 4) 업데이트 배포

```bash
scp deploy/oracle_vm_update.sh ubuntu@<VM_PUBLIC_IP>:~/
ssh ubuntu@<VM_PUBLIC_IP> 'bash ~/oracle_vm_update.sh main'
```

## 5) 확인

```bash
curl http://<VM_PUBLIC_IP>:8080/health
```

## 6) GitHub Pages와 함께 사용

- 프런트: GitHub Pages (`web/`)
- 백엔드: Oracle VM (`http://<VM_PUBLIC_IP>:8080` 또는 도메인)
- Pages 화면 상단 `API Base`에 백엔드 주소 입력
- 서버 `.env`에서 `CORS_ORIGIN=https://<your-account>.github.io` 권장

## 선택: PostgreSQL 컨테이너도 같이 실행

```bash
docker compose --profile postgres up -d postgres
```

현재 앱 런타임 저장소는 SQLite입니다. PostgreSQL은 마이그레이션 준비용으로 추가되어 있습니다.
