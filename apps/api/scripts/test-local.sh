#!/bin/bash

# 로컬 테스트 스크립트

set -e

echo "🚀 Household Ledger API 로컬 테스트 시작"

# 1. Docker Compose로 MySQL 시작
echo "📦 MySQL 컨테이너 시작 중..."
docker-compose up -d

# 2. MySQL이 준비될 때까지 대기
echo "⏳ MySQL 준비 대기 중..."
sleep 5

# 3. MySQL 연결 테스트
echo "🔍 MySQL 연결 테스트..."
until docker-compose exec -T mysql mysql -u household_user -phousehold_password -e "SELECT 1" household_ledger > /dev/null 2>&1; do
    echo "   MySQL이 아직 준비되지 않았습니다. 대기 중..."
    sleep 2
done

echo "✅ MySQL이 준비되었습니다!"

# 4. .env 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "   .env 파일을 확인하고 필요한 값들을 설정해주세요."
fi

# 5. 애플리케이션 실행
echo "🎯 애플리케이션 실행 중..."
echo "   서버는 http://localhost:8080 에서 실행됩니다"
echo "   Health check: curl http://localhost:8080/health"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

cargo run

