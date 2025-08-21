# 🐳 Docker 직접 명령어 사용법

Docker Compose 없이 단순한 `docker` 명령어만으로 MySQL 데이터베이스를 관리하는 방법입니다.

## 🚀 빠른 시작

### 1. 자동화 스크립트 사용 (권장)

```bash
# 스크립트 실행 권한 부여
chmod +x run-mysql.sh

# MySQL 시작 (이미지가 없으면 자동으로 빌드)
./run-mysql.sh start

# 상태 확인
./run-mysql.sh status

# MySQL 접속
./run-mysql.sh connect

# 로그 확인
./run-mysql.sh logs

# 중지
./run-mysql.sh stop

# 도움말
./run-mysql.sh help
```

### 2. 수동 Docker 명령어

#### 이미지 빌드
```bash
docker build -f database.Dockerfile -t household-ledger-mysql .
```

#### 컨테이너 실행
```bash
docker run -d \
  --name household-ledger-mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=household_ledger_root_password \
  -e MYSQL_DATABASE=household_ledger \
  -e MYSQL_USER=household_user \
  -e MYSQL_PASSWORD=household_password \
  -e TZ=Asia/Seoul \
  -v mysql_data:/var/lib/mysql \
  -v mysql_logs:/var/log/mysql \
  --restart unless-stopped \
  household-ledger-mysql
```

#### 컨테이너 관리
```bash
# 상태 확인
docker ps
docker ps -a  # 모든 컨테이너 (중지된 것 포함)

# 로그 확인
docker logs household-ledger-mysql
docker logs -f household-ledger-mysql  # 실시간 로그

# 컨테이너 중지
docker stop household-ledger-mysql

# 컨테이너 시작 (이미 생성된 경우)
docker start household-ledger-mysql

# 컨테이너 재시작
docker restart household-ledger-mysql

# 컨테이너 삭제
docker rm household-ledger-mysql
docker rm -f household-ledger-mysql  # 강제 삭제
```

#### MySQL 접속
```bash
# 컨테이너 내부에서 MySQL 접속
docker exec -it household-ledger-mysql mysql -uhousehold_user -p household_ledger

# 컨테이너 내부 bash 접속
docker exec -it household-ledger-mysql bash

# 로컬에서 MySQL 클라이언트로 접속 (MySQL 클라이언트가 설치된 경우)
mysql -h localhost -P 3307 -uhousehold_user -p household_ledger
```

## 📁 볼륨 및 데이터 관리

### 볼륨 확인
```bash
# 모든 볼륨 목록
docker volume ls

# 특정 볼륨 상세 정보
docker volume inspect mysql_data
docker volume inspect mysql_logs
```

### 데이터 백업
```bash
# 데이터베이스 백업
docker exec household-ledger-mysql mysqldump -uhousehold_user -phousehold_password household_ledger > backup.sql

# 볼륨 백업 (컨테이너가 중지된 상태에서)
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_data_backup.tar.gz -C /data .
```

### 데이터 복원
```bash
# 데이터베이스 복원
docker exec -i household-ledger-mysql mysql -uhousehold_user -phousehold_password household_ledger < backup.sql

# 볼륨 복원 (새 볼륨에)
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_data_backup.tar.gz -C /data
```

### 완전 정리
```bash
# 컨테이너 삭제
docker rm -f household-ledger-mysql

# 이미지 삭제
docker rmi household-ledger-mysql

# 볼륨 삭제 (데이터 완전 삭제!)
docker volume rm mysql_data mysql_logs

# 사용하지 않는 볼륨 일괄 삭제
docker volume prune
```

## 🔧 설정 커스터마이징

### 포트 변경
```bash
# 3308 포트로 실행
docker run -d \
  --name household-ledger-mysql \
  -p 3308:3306 \
  # ... 나머지 옵션 동일
```

### 환경 변수 변경
```bash
# 다른 데이터베이스명, 사용자명으로 실행
docker run -d \
  --name household-ledger-mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=your_root_password \
  -e MYSQL_DATABASE=your_database \
  -e MYSQL_USER=your_user \
  -e MYSQL_PASSWORD=your_password \
  # ... 나머지 옵션
```

### 추가 볼륨 마운트
```bash
# 로컬 디렉토리를 컨테이너에 마운트
docker run -d \
  --name household-ledger-mysql \
  -p 3307:3306 \
  -v $(pwd)/data:/var/lib/mysql \
  -v $(pwd)/logs:/var/log/mysql \
  -v $(pwd)/mysql.cnf:/etc/mysql/conf.d/mysql.cnf:ro \
  # ... 나머지 옵션
```

## 🔍 문제 해결

### 자주 사용하는 디버깅 명령어
```bash
# 컨테이너 상세 정보
docker inspect household-ledger-mysql

# 리소스 사용량 모니터링
docker stats household-ledger-mysql

# 프로세스 확인
docker exec household-ledger-mysql ps aux

# 네트워크 확인
docker port household-ledger-mysql

# 파일 시스템 확인
docker exec household-ledger-mysql df -h
docker exec household-ledger-mysql ls -la /var/lib/mysql
```

### 포트 충돌 해결
```bash
# 사용 중인 포트 확인
lsof -i :3307
netstat -tuln | grep 3307

# 다른 포트로 실행
docker run -p 3308:3306 # ... 나머지 옵션
```

### 권한 문제 해결
```bash
# 컨테이너 내부에서 권한 확인
docker exec household-ledger-mysql ls -la /var/lib/mysql

# MySQL 사용자 권한 재설정
docker exec -it household-ledger-mysql mysql -uroot -p -e "
GRANT ALL PRIVILEGES ON household_ledger.* TO 'household_user'@'%';
FLUSH PRIVILEGES;
"
```

## 📊 모니터링

### 컨테이너 헬스체크
```bash
# 헬스 상태 확인
docker inspect --format='{{.State.Health.Status}}' household-ledger-mysql

# 헬스체크 로그
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' household-ledger-mysql
```

### 리소스 모니터링
```bash
# 실시간 리소스 사용량
docker stats household-ledger-mysql

# 메모리 사용량
docker exec household-ledger-mysql free -h

# 디스크 사용량
docker exec household-ledger-mysql df -h
```

---

💡 **팁**: `run-mysql.sh` 스크립트를 사용하면 이러한 복잡한 명령어들을 간단하게 사용할 수 있습니다!
