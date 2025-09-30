# 데이터베이스 설계 개요

- MySQL 8.4 + Prisma
- 9개 핵심 테이블로 단순화: User, Group, GroupInvite, Category, Tag, Transaction, Attachment, Budget, RecurringRule
- 관계: User→Group, Transaction→Category/Tag, Attachment→Transaction

## 마이그레이션 명령어

```bash
pnpm db:generate
pnpm db:push
```

추가 상세는 추후 ERD 문서로 확장 예정입니다.
