# MySQL 8.0 LTS - 안정적인 버전 사용
FROM mysql:8.0

# 환경 변수 설정 (로컬 개발용)
ENV MYSQL_ROOT_PASSWORD=wjdwhdans
ENV MYSQL_DATABASE=household_ledger
ENV MYSQL_USER=user
ENV MYSQL_PASSWORD=wjdwhdans

# 시간대 설정
ENV TZ=Asia/Seoul

# MySQL 8.0 한국어 및 시간대 설정 (deprecated 옵션 제거)
RUN echo '[mysqld]' > /etc/mysql/conf.d/household.cnf && \
    echo 'character-set-server=utf8mb4' >> /etc/mysql/conf.d/household.cnf && \
    echo 'collation-server=utf8mb4_unicode_ci' >> /etc/mysql/conf.d/household.cnf && \
    echo 'default-time-zone="+09:00"' >> /etc/mysql/conf.d/household.cnf && \
    echo 'innodb_file_per_table=1' >> /etc/mysql/conf.d/household.cnf && \
    echo 'max_connections=200' >> /etc/mysql/conf.d/household.cnf && \
    echo 'bind-address=0.0.0.0' >> /etc/mysql/conf.d/household.cnf && \
    echo '' >> /etc/mysql/conf.d/household.cnf && \
    echo '[mysql]' >> /etc/mysql/conf.d/household.cnf && \
    echo 'default-character-set=utf8mb4' >> /etc/mysql/conf.d/household.cnf && \
    echo '' >> /etc/mysql/conf.d/household.cnf && \
    echo '[client]' >> /etc/mysql/conf.d/household.cnf && \
    echo 'default-character-set=utf8mb4' >> /etc/mysql/conf.d/household.cnf

# 초기화 스크립트 복사 (통합 버전 - 권한 설정만)
COPY docker/init_database.sql /docker-entrypoint-initdb.d/

# 포트 노출
EXPOSE 3306

# 헬스체크 설정 (root 계정 사용)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD mysqladmin ping -h localhost -uroot -p$MYSQL_ROOT_PASSWORD || exit 1
