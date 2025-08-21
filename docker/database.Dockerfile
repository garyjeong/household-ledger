# MySQL 8.4 (LTS) - 최신 버전 사용
FROM mysql:8.4

# 환경 변수 설정
ENV MYSQL_ROOT_PASSWORD=household_ledger_root_password
ENV MYSQL_DATABASE=household_ledger
ENV MYSQL_USER=household_user
ENV MYSQL_PASSWORD=household_password

# 한국어 및 UTF-8 설정
ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8

# MySQL 설정 파일 복사
COPY mysql.cnf /etc/mysql/conf.d/

# 초기화 스크립트 복사
COPY init/ /docker-entrypoint-initdb.d/

# 포트 노출
EXPOSE 3306

# 볼륨 설정 (데이터 영속성)
VOLUME ["/var/lib/mysql"]

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD mysqladmin ping -h localhost -u$MYSQL_USER -p$MYSQL_PASSWORD || exit 1
