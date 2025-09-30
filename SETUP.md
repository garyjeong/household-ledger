# 설정 & 보안 가이드

## 환경변수 예시 (`.env.local`)

```env
DATABASE_URL="mysql://root:password@localhost:3307/household_ledger"
JWT_SECRET="your-dev-secret"
JWT_REFRESH_SECRET="your-dev-refresh"
```

## Docker MySQL (로컬)

```bash
docker build -f docker/database.Dockerfile -t household-ledger .
docker run --name household-ledger -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=household_ledger -p 3307:3306 -d household-ledger
```

## 보안 체크리스트

- 쿠키: Secure, SameSite=Lax, HttpOnly(서버 쿠키)
- 보안 헤더: X-Frame-Options=DENY, Referrer-Policy=strict-origin-when-cross-origin
- 민감정보 로깅 금지, 토큰 유효기간 관리
