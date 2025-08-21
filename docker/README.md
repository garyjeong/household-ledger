# 🐳 Docker Database Setup

Household Ledger 애플리케이션을 위한 MySQL 8.4 데이터베이스 Docker 설정입니다.

## 📋 포함된 서비스

- **MySQL 8.4**: 메인 데이터베이스 (LTS 버전)
- **phpMyAdmin 5.2**: 웹 기반 데이터베이스 관리 도구 (개발용)
- **Redis 7.4**: 캐싱 및 세션 저장 (향후 사용)

## 🚀 빠른 시작

### 1. 데이터베이스만 실행
```bash
cd docker
docker-compose up mysql -d
```

### 2. 개발 환경 전체 실행 (phpMyAdmin 포함)
```bash
cd docker
docker-compose --profile dev up -d
```

### 3. 로그 확인
```bash
# MySQL 로그
docker-compose logs -f mysql

# 모든 서비스 로그
docker-compose logs -f
```

## 🔧 설정 정보

### MySQL 연결 정보
- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `household_ledger`
- **Username**: `household_user`
- **Password**: `household_password`
- **Root Password**: `household_ledger_root_password`

### phpMyAdmin 접속 (개발용)
- **URL**: http://localhost:8080
- **Username**: `household_user`
- **Password**: `household_password`

### Redis 연결 정보 (향후 사용)
- **Host**: `localhost`
- **Port**: `6379`
- **Password**: `household_redis_password`

## 📁 파일 구조

```
docker/
├── database.Dockerfile     # MySQL 커스텀 이미지
├── mysql.cnf              # MySQL 설정 파일
├── docker-compose.yml     # Docker Compose 설정
├── init/                  # 데이터베이스 초기화 스크립트
│   └── 01-create-database.sql
└── README.md              # 이 파일
```

## 🔄 주요 명령어

### 데이터베이스 시작
```bash
cd docker
docker-compose up mysql -d
```

### 데이터베이스 중지
```bash
cd docker
docker-compose down
```

### 데이터베이스 재시작
```bash
cd docker
docker-compose restart mysql
```

### 데이터베이스 상태 확인
```bash
cd docker
docker-compose ps
```

### 데이터베이스 접속
```bash
# MySQL 컨테이너에 직접 접속
docker-compose exec mysql mysql -uhousehold_user -p household_ledger

# 또는 로컬에서 MySQL 클라이언트 사용
mysql -h localhost -P 3306 -uhousehold_user -p household_ledger
```

## 🗄️ 데이터 관리

### 백업
```bash
# 데이터 백업
docker-compose exec mysql mysqldump -uhousehold_user -p household_ledger > backup.sql
```

### 복원
```bash
# 데이터 복원
docker-compose exec -T mysql mysql -uhousehold_user -p household_ledger < backup.sql
```

### 볼륨 초기화 (주의!)
```bash
# 모든 데이터가 삭제됩니다!
docker-compose down -v
docker volume prune
```

## 🔧 설정 커스터마이징

### MySQL 설정 변경
`mysql.cnf` 파일을 편집한 후 컨테이너를 재시작하세요:
```bash
docker-compose restart mysql
```

### 환경 변수 변경
`docker-compose.yml`의 environment 섹션을 수정하세요.

### 포트 변경
`docker-compose.yml`의 ports 섹션을 수정하세요:
```yaml
ports:
  - "3307:3306"  # 호스트 포트를 3307로 변경
```

## 🐛 문제 해결

### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3306

# 다른 포트 사용 (docker-compose.yml 수정)
ports:
  - "3307:3306"
```

### 권한 문제
```bash
# 컨테이너 재시작
docker-compose restart mysql

# 권한 재설정
docker-compose exec mysql mysql -uroot -p -e "GRANT ALL PRIVILEGES ON household_ledger.* TO 'household_user'@'%'; FLUSH PRIVILEGES;"
```

### 로그 확인
```bash
# MySQL 에러 로그
docker-compose logs mysql | grep ERROR

# 초기화 로그
docker-compose exec mysql mysql -uhousehold_user -p -e "SELECT * FROM household_ledger._init_log;"
```

## 🔗 Next.js 연결

`.env.local` 파일에 다음과 같이 설정하세요:

```env
# Database
DATABASE_URL="mysql://household_user:household_password@localhost:3306/household_ledger"

# Redis (향후 사용)
REDIS_URL="redis://:household_redis_password@localhost:6379"
```

## 📊 성능 모니터링

### MySQL 성능 확인
```bash
# 프로세스 리스트
docker-compose exec mysql mysql -uhousehold_user -p -e "SHOW PROCESSLIST;"

# 상태 확인
docker-compose exec mysql mysql -uhousehold_user -p -e "SHOW STATUS LIKE 'Threads%';"

# 쿼리 캐시 상태
docker-compose exec mysql mysql -uhousehold_user -p -e "SHOW STATUS LIKE 'Qcache%';"
```

## 🔒 보안 고려사항

1. **프로덕션 환경**: 비밀번호 변경 필수
2. **네트워크**: 필요한 포트만 외부 노출
3. **백업**: 정기적인 데이터 백업 수행
4. **업데이트**: MySQL 보안 패치 정기 적용

---

💡 **팁**: 개발 시에는 `--profile dev` 옵션으로 phpMyAdmin도 함께 실행하여 데이터베이스를 쉽게 관리할 수 있습니다.
