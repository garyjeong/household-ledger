#!/bin/bash

# Household Ledger MySQL Database Setup Script
# Docker Compose 없이 단순한 docker 명령어 사용

set -e

# 컬러 출력을 위한 변수
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 기본 설정값
CONTAINER_NAME="household-ledger-mysql"
IMAGE_NAME="household-ledger-mysql"
HOST_PORT="3307"
CONTAINER_PORT="3306"
MYSQL_ROOT_PASSWORD="household_ledger_root_password"
MYSQL_DATABASE="household_ledger"
MYSQL_USER="household_user"
MYSQL_PASSWORD="household_password"

# 함수: 도움말 출력
show_help() {
    echo -e "${BLUE}Household Ledger MySQL Database Management${NC}"
    echo ""
    echo "사용법: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  build       Docker 이미지 빌드"
    echo "  start       MySQL 컨테이너 시작"
    echo "  stop        MySQL 컨테이너 중지"
    echo "  restart     MySQL 컨테이너 재시작"
    echo "  status      컨테이너 상태 확인"
    echo "  logs        컨테이너 로그 확인"
    echo "  connect     MySQL에 접속"
    echo "  clean       컨테이너 및 이미지 삭제"
    echo "  help        이 도움말 출력"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  -p, --port PORT    호스트 포트 지정 (기본값: 3307)"
    echo "  -n, --name NAME    컨테이너 이름 지정"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 start -p 3308"
    echo "  $0 connect"
    echo "  $0 logs"
}

# 함수: Docker 이미지 빌드
build_image() {
    echo -e "${BLUE}🔨 MySQL Docker 이미지 빌드 중...${NC}"
    docker build -f database.Dockerfile -t "$IMAGE_NAME" .
    echo -e "${GREEN}✅ 이미지 빌드 완료: $IMAGE_NAME${NC}"
}

# 함수: MySQL 컨테이너 시작
start_container() {
    # 기존 컨테이너가 실행 중인지 확인
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "${YELLOW}⚠️ 컨테이너가 이미 실행 중입니다: $CONTAINER_NAME${NC}"
        return 0
    fi

    # 중지된 컨테이너가 있는지 확인
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        echo -e "${BLUE}🔄 기존 컨테이너를 시작합니다...${NC}"
        docker start "$CONTAINER_NAME"
    else
        echo -e "${BLUE}🚀 새 MySQL 컨테이너를 시작합니다...${NC}"
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p "$HOST_PORT:$CONTAINER_PORT" \
            -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
            -e MYSQL_DATABASE="$MYSQL_DATABASE" \
            -e MYSQL_USER="$MYSQL_USER" \
            -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
            -e TZ=Asia/Seoul \
            -v mysql_data:/var/lib/mysql \
            -v mysql_logs:/var/log/mysql \
            --restart unless-stopped \
            "$IMAGE_NAME"
    fi

    echo -e "${GREEN}✅ MySQL 컨테이너가 시작되었습니다${NC}"
    echo -e "${BLUE}📊 연결 정보:${NC}"
    echo "  호스트: localhost"
    echo "  포트: $HOST_PORT"
    echo "  데이터베이스: $MYSQL_DATABASE"
    echo "  사용자명: $MYSQL_USER"
    echo "  비밀번호: $MYSQL_PASSWORD"
}

# 함수: 컨테이너 중지
stop_container() {
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "${BLUE}🛑 MySQL 컨테이너를 중지합니다...${NC}"
        docker stop "$CONTAINER_NAME"
        echo -e "${GREEN}✅ 컨테이너가 중지되었습니다${NC}"
    else
        echo -e "${YELLOW}⚠️ 실행 중인 컨테이너가 없습니다${NC}"
    fi
}

# 함수: 컨테이너 재시작
restart_container() {
    echo -e "${BLUE}🔄 MySQL 컨테이너를 재시작합니다...${NC}"
    stop_container
    sleep 2
    start_container
}

# 함수: 컨테이너 상태 확인
check_status() {
    echo -e "${BLUE}📊 컨테이너 상태:${NC}"
    if docker ps | grep -q "$CONTAINER_NAME"; then
        docker ps | grep "$CONTAINER_NAME"
        echo ""
        echo -e "${GREEN}✅ MySQL이 실행 중입니다${NC}"
        
        # 헬스체크 상태 확인
        HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-healthcheck")
        if [ "$HEALTH_STATUS" = "healthy" ]; then
            echo -e "${GREEN}✅ 헬스체크: 정상${NC}"
        elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
            echo -e "${RED}❌ 헬스체크: 비정상${NC}"
        elif [ "$HEALTH_STATUS" = "starting" ]; then
            echo -e "${YELLOW}⏳ 헬스체크: 시작 중${NC}"
        fi
    elif docker ps -a | grep -q "$CONTAINER_NAME"; then
        echo -e "${YELLOW}⚠️ 컨테이너가 중지되어 있습니다${NC}"
        docker ps -a | grep "$CONTAINER_NAME"
    else
        echo -e "${RED}❌ 컨테이너가 존재하지 않습니다${NC}"
    fi
}

# 함수: 로그 확인
show_logs() {
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        echo -e "${BLUE}📋 MySQL 컨테이너 로그 (최근 50줄):${NC}"
        docker logs --tail 50 "$CONTAINER_NAME"
    else
        echo -e "${RED}❌ 컨테이너가 존재하지 않습니다${NC}"
    fi
}

# 함수: MySQL 접속
connect_mysql() {
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "${BLUE}🔗 MySQL에 접속합니다...${NC}"
        echo -e "${YELLOW}비밀번호: $MYSQL_PASSWORD${NC}"
        docker exec -it "$CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"
    else
        echo -e "${RED}❌ MySQL 컨테이너가 실행되지 않았습니다${NC}"
        echo "먼저 '$0 start' 명령으로 컨테이너를 시작해주세요."
    fi
}

# 함수: 정리 (컨테이너 및 이미지 삭제)
clean_all() {
    echo -e "${YELLOW}⚠️ 이 작업은 모든 데이터를 삭제합니다!${NC}"
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 컨테이너 중지 및 삭제
        if docker ps -a | grep -q "$CONTAINER_NAME"; then
            echo -e "${BLUE}🗑️ 컨테이너를 삭제합니다...${NC}"
            docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
        fi
        
        # 이미지 삭제
        if docker images | grep -q "$IMAGE_NAME"; then
            echo -e "${BLUE}🗑️ 이미지를 삭제합니다...${NC}"
            docker rmi "$IMAGE_NAME" 2>/dev/null || true
        fi
        
        # 볼륨 삭제
        echo -e "${BLUE}🗑️ 볼륨을 삭제합니다...${NC}"
        docker volume rm mysql_data mysql_logs 2>/dev/null || true
        
        echo -e "${GREEN}✅ 정리 완료${NC}"
    else
        echo -e "${BLUE}취소되었습니다.${NC}"
    fi
}

# 명령행 인수 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            HOST_PORT="$2"
            shift 2
            ;;
        -n|--name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        build)
            COMMAND="build"
            shift
            ;;
        start)
            COMMAND="start"
            shift
            ;;
        stop)
            COMMAND="stop"
            shift
            ;;
        restart)
            COMMAND="restart"
            shift
            ;;
        status)
            COMMAND="status"
            shift
            ;;
        logs)
            COMMAND="logs"
            shift
            ;;
        connect)
            COMMAND="connect"
            shift
            ;;
        clean)
            COMMAND="clean"
            shift
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 옵션: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Docker가 설치되어 있는지 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되지 않았습니다${NC}"
    echo "Docker를 먼저 설치해주세요: https://docs.docker.com/get-docker/"
    exit 1
fi

# 명령 실행
case $COMMAND in
    build)
        build_image
        ;;
    start)
        # 이미지가 없으면 먼저 빌드
        if ! docker images | grep -q "$IMAGE_NAME"; then
            echo -e "${YELLOW}⚠️ 이미지가 없습니다. 먼저 빌드합니다...${NC}"
            build_image
        fi
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    connect)
        connect_mysql
        ;;
    clean)
        clean_all
        ;;
    "")
        echo -e "${YELLOW}명령이 지정되지 않았습니다.${NC}"
        show_help
        ;;
    *)
        echo -e "${RED}❌ 알 수 없는 명령: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac
