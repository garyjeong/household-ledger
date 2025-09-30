# 개발 가이드 (Minimal Change)

- Node 18+, pnpm 8+, MySQL 8.4(Docker 권장)
- 코드 품질: ESLint, Prettier, TypeScript strict
- 상태 관리: React Query 단일 패턴, 공통 `api-client.ts` 사용

## 로컬 개발

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## 테스트

```bash
pnpm test            # 단위
pnpm test:e2e        # E2E
pnpm test:coverage   # 커버리지
```

## 문서 위치

- 데이터베이스: `DATABASE.md`
- 설정/보안: `SETUP.md`
