# 빠른 시작 가이드

로컬에서 Docker를 사용하여 빠르게 테스트하는 방법입니다.

## 1단계: 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (필요시)
# DATABASE_URL과 JWT_SECRET은 기본값으로도 작동합니다
```

## 2단계: MySQL 시작

```bash
# Docker Compose로 MySQL 시작
docker-compose up -d

# 또는 Makefile 사용
make up
```

## 3단계: 애플리케이션 실행

```bash
# 방법 1: 스크립트 사용 (권장)
./scripts/test-local.sh

# 방법 2: Makefile 사용
make run

# 방법 3: 직접 실행
cargo run
```

## 4단계: 테스트

### Health Check

```bash
curl http://localhost:8080/health
```

예상 응답:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T12:00:00Z"
}
```

### 회원가입 테스트

```bash
curl -X POST http://localhost:8080/api/v2/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "nickname": "테스트 사용자"
  }'
```

### 로그인 테스트

```bash
curl -X POST http://localhost:8080/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 중지

```bash
# 애플리케이션: Ctrl+C

# MySQL 중지
docker-compose down
# 또는
make down
```

## 문제 해결

### MySQL이 시작되지 않는 경우

```bash
# 로그 확인
docker-compose logs mysql

# 컨테이너 재시작
docker-compose restart mysql
```

### 포트 충돌

8080 포트가 사용 중인 경우:

1. `.env` 파일에 `PORT=8081` 추가
2. 또는 다른 포트를 사용하는 프로세스 종료

### 데이터베이스 초기화

```bash
# 모든 데이터 삭제 후 재시작
docker-compose down -v
docker-compose up -d
```

