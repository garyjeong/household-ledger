.PHONY: help setup up down logs test clean migrate

help: ## 도움말 표시
	@echo "사용 가능한 명령어:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

setup: ## 초기 설정 (.env 파일 생성)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env 파일이 생성되었습니다. 필요한 값들을 설정해주세요."; \
	else \
		echo ".env 파일이 이미 존재합니다."; \
	fi

up: ## Docker Compose로 MySQL 시작
	docker-compose up -d
	@echo "MySQL이 시작되었습니다. 잠시 기다린 후 애플리케이션을 실행하세요."

down: ## Docker Compose로 MySQL 중지
	docker-compose down

logs: ## MySQL 로그 확인
	docker-compose logs -f mysql

test: ## 테스트 실행
	cargo test

clean: ## 빌드 캐시 정리
	cargo clean

migrate: ## 마이그레이션 실행 (수동)
	@echo "마이그레이션은 애플리케이션 시작 시 자동으로 실행됩니다."
	@echo "수동 실행이 필요한 경우: sqlx migrate run"

run: ## 애플리케이션 실행
	cargo run

run-release: ## 릴리스 모드로 실행
	cargo run --release

check: ## 코드 검사
	cargo check

fmt: ## 코드 포맷팅
	cargo fmt

clippy: ## 린팅
	cargo clippy

