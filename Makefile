# GramCare Health Chatbot - Makefile
# This Makefile provides convenient commands for development and deployment

.PHONY: help setup install dev start build test lint clean docker deploy backup restore health status

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
NC := \033[0m # No Color

# Project configuration
PROJECT_NAME := gramcare
VERSION := $(shell node -p "require('./package.json').version")
NODE_VERSION := $(shell node -p "require('./package.json').volta.node")
NPM_VERSION := $(shell node -p "require('./package.json').volta.npm")

## Help
help: ## Show this help message
	@echo "$(CYAN)GramCare Health Chatbot - Development Commands$(NC)"
	@echo "$(CYAN)================================================$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Installation:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / && /Setup|Install/ {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / && /Development|Dev|Start|Build|Test|Lint/ {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Docker & Deployment:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / && /Docker|Deploy|Production/ {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / && /Clean|Backup|Restore|Health|Status|Security/ {printf "  $(BLUE)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Project Info:$(NC)"
	@echo "  Name: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Node: $(NODE_VERSION)"
	@echo "  NPM: $(NPM_VERSION)"
	@echo ""

## Setup & Installation
setup: ## Setup development environment
	@echo "$(GREEN)[SETUP]$(NC) Setting up development environment..."
	@chmod +x scripts/*.sh
	@./scripts/dev-setup.sh

install: ## Install all dependencies
	@echo "$(GREEN)[INSTALL]$(NC) Installing dependencies..."
	@npm run install:all

install-root: ## Install root dependencies only
	@echo "$(GREEN)[INSTALL]$(NC) Installing root dependencies..."
	@npm install

install-server: ## Install server dependencies only
	@echo "$(GREEN)[INSTALL]$(NC) Installing server dependencies..."
	@cd server && npm install

install-client: ## Install client dependencies only
	@echo "$(GREEN)[INSTALL]$(NC) Installing client dependencies..."
	@cd client && npm install

## Development
dev: ## Start development servers
	@echo "$(GREEN)[DEV]$(NC) Starting development servers..."
	@./scripts/dev-start.sh

dev-legacy: ## Start development servers (legacy mode)
	@echo "$(GREEN)[DEV]$(NC) Starting development servers (legacy mode)..."
	@npm run dev:legacy

start: dev ## Alias for dev

server: ## Start server only
	@echo "$(GREEN)[SERVER]$(NC) Starting server..."
	@cd server && npm run dev

client: ## Start client only
	@echo "$(GREEN)[CLIENT]$(NC) Starting client..."
	@cd client && npm start

## Build
build: ## Build for production
	@echo "$(GREEN)[BUILD]$(NC) Building for production..."
	@npm run build

build-client: ## Build client only
	@echo "$(GREEN)[BUILD]$(NC) Building client..."
	@npm run build:client

build-server: ## Build server only
	@echo "$(GREEN)[BUILD]$(NC) Building server..."
	@npm run build:server

## Testing
test: ## Run all tests
	@echo "$(GREEN)[TEST]$(NC) Running all tests..."
	@npm run test

test-client: ## Run client tests
	@echo "$(GREEN)[TEST]$(NC) Running client tests..."
	@npm run test:client

test-server: ## Run server tests
	@echo "$(GREEN)[TEST]$(NC) Running server tests..."
	@npm run test:server

test-watch: ## Run tests in watch mode
	@echo "$(GREEN)[TEST]$(NC) Running tests in watch mode..."
	@cd client && npm test

## Linting & Formatting
lint: ## Run linting
	@echo "$(GREEN)[LINT]$(NC) Running linting..."
	@npm run lint

lint-fix: ## Fix linting issues
	@echo "$(GREEN)[LINT]$(NC) Fixing linting issues..."
	@npm run lint:fix

format: ## Format code
	@echo "$(GREEN)[FORMAT]$(NC) Formatting code..."
	@npm run format

format-check: ## Check code formatting
	@echo "$(GREEN)[FORMAT]$(NC) Checking code formatting..."
	@npm run format:check

## Docker
docker-build: ## Build Docker images
	@echo "$(GREEN)[DOCKER]$(NC) Building Docker images..."
	@./scripts/prod-deploy.sh build

docker-up: ## Start Docker containers
	@echo "$(GREEN)[DOCKER]$(NC) Starting Docker containers..."
	@docker-compose up -d

docker-down: ## Stop Docker containers
	@echo "$(GREEN)[DOCKER]$(NC) Stopping Docker containers..."
	@docker-compose down

docker-logs: ## Show Docker logs
	@echo "$(GREEN)[DOCKER]$(NC) Showing Docker logs..."
	@docker-compose logs -f

docker-restart: docker-down docker-up ## Restart Docker containers

## Deployment
deploy-staging: ## Deploy to staging
	@echo "$(GREEN)[DEPLOY]$(NC) Deploying to staging..."
	@./scripts/prod-deploy.sh deploy --env staging

deploy-production: ## Deploy to production
	@echo "$(GREEN)[DEPLOY]$(NC) Deploying to production..."
	@./scripts/prod-deploy.sh deploy --env production

rollback: ## Rollback deployment
	@echo "$(GREEN)[DEPLOY]$(NC) Rolling back deployment..."
	@./scripts/prod-deploy.sh rollback

## Maintenance
clean: ## Clean all build artifacts and dependencies
	@echo "$(RED)[CLEAN]$(NC) Cleaning all build artifacts and dependencies..."
	@npm run clean

clean-client: ## Clean client build artifacts
	@echo "$(RED)[CLEAN]$(NC) Cleaning client build artifacts..."
	@npm run clean:client

clean-server: ## Clean server build artifacts
	@echo "$(RED)[CLEAN]$(NC) Cleaning server build artifacts..."
	@npm run clean:server

clean-docker: ## Clean Docker containers and images
	@echo "$(RED)[CLEAN]$(NC) Cleaning Docker containers and images..."
	@npm run clean:docker

backup: ## Create database backup
	@echo "$(GREEN)[BACKUP]$(NC) Creating database backup..."
	@./scripts/prod-deploy.sh backup

restore: ## Restore from backup
	@echo "$(GREEN)[RESTORE]$(NC) Restoring from backup..."
	@./scripts/prod-deploy.sh restore

health: ## Run health checks
	@echo "$(GREEN)[HEALTH]$(NC) Running health checks..."
	@./scripts/prod-deploy.sh health

status: ## Show deployment status
	@echo "$(GREEN)[STATUS]$(NC) Showing deployment status..."
	@./scripts/prod-deploy.sh status

## Logs
logs: ## Show all logs
	@echo "$(GREEN)[LOGS]$(NC) Showing all logs..."
	@./scripts/prod-deploy.sh logs

logs-server: ## Show server logs
	@echo "$(GREEN)[LOGS]$(NC) Showing server logs..."
	@./scripts/prod-deploy.sh logs server

logs-client: ## Show client logs
	@echo "$(GREEN)[LOGS]$(NC) Showing client logs..."
	@./scripts/prod-deploy.sh logs client

logs-mongo: ## Show MongoDB logs
	@echo "$(GREEN)[LOGS]$(NC) Showing MongoDB logs..."
	@./scripts/prod-deploy.sh logs mongo

logs-redis: ## Show Redis logs
	@echo "$(GREEN)[LOGS]$(NC) Showing Redis logs..."
	@./scripts/prod-deploy.sh logs redis

## Security
security-audit: ## Run security audit
	@echo "$(GREEN)[SECURITY]$(NC) Running security audit..."
	@npm run security:audit

security-fix: ## Fix security vulnerabilities
	@echo "$(GREEN)[SECURITY]$(NC) Fixing security vulnerabilities..."
	@npm run security:fix

## Dependencies
update-deps: ## Update dependencies
	@echo "$(GREEN)[UPDATE]$(NC) Updating dependencies..."
	@npm run update:deps

check-outdated: ## Check for outdated dependencies
	@echo "$(GREEN)[CHECK]$(NC) Checking for outdated dependencies..."
	@npm run check:outdated

## Git hooks
install-hooks: ## Install Git hooks
	@echo "$(GREEN)[HOOKS]$(NC) Installing Git hooks..."
	@npm run prepare

## Environment
env-example: ## Create example environment files
	@echo "$(GREEN)[ENV]$(NC) Creating example environment files..."
	@cp .env.example .env 2>/dev/null || echo "No .env.example found"
	@cp server/.env.example server/.env 2>/dev/null || echo "No server/.env.example found"
	@cp client/.env.example client/.env 2>/dev/null || echo "No client/.env.example found"

## Quick commands
quick-start: install dev ## Quick start (install + dev)

full-setup: setup install build test ## Full setup (setup + install + build + test)

ci: install lint test build ## CI pipeline (install + lint + test + build)

cd: build docker-build deploy-staging ## CD pipeline (build + docker-build + deploy-staging)

## Info
info: ## Show project information
	@echo "$(CYAN)Project Information$(NC)"
	@echo "$(CYAN)==================$(NC)"
	@echo "Name: $(PROJECT_NAME)"
	@echo "Version: $(VERSION)"
	@echo "Node Version: $(NODE_VERSION)"
	@echo "NPM Version: $(NPM_VERSION)"
	@echo ""
	@echo "$(CYAN)Available Scripts:$(NC)"
	@npm run | grep -E '^  [a-zA-Z]' | sed 's/^  /  - /'
	@echo ""
	@echo "$(CYAN)Docker Images:$(NC)"
	@docker images | grep gramcare || echo "No GramCare images found"
	@echo ""
	@echo "$(CYAN)Running Containers:$(NC)"
	@docker-compose ps || echo "No containers running"

version: ## Show version
	@echo $(VERSION)

## Development utilities
watch-server: ## Watch server files for changes
	@echo "$(GREEN)[WATCH]$(NC) Watching server files..."
	@cd server && npm run dev

watch-client: ## Watch client files for changes
	@echo "$(GREEN)[WATCH]$(NC) Watching client files..."
	@cd client && npm start

debug-server: ## Start server in debug mode
	@echo "$(GREEN)[DEBUG]$(NC) Starting server in debug mode..."
	@cd server && npm run debug

profile-client: ## Profile client bundle
	@echo "$(GREEN)[PROFILE]$(NC) Profiling client bundle..."
	@cd client && npm run analyze

## Database
db-seed: ## Seed database with sample data
	@echo "$(GREEN)[DB]$(NC) Seeding database..."
	@cd server && npm run db:seed

db-reset: ## Reset database
	@echo "$(RED)[DB]$(NC) Resetting database..."
	@cd server && npm run db:reset

db-migrate: ## Run database migrations
	@echo "$(GREEN)[DB]$(NC) Running database migrations..."
	@cd server && npm run db:migrate

## Performance
perf-test: ## Run performance tests
	@echo "$(GREEN)[PERF]$(NC) Running performance tests..."
	@cd server && npm run test:perf

load-test: ## Run load tests
	@echo "$(GREEN)[LOAD]$(NC) Running load tests..."
	@cd server && npm run test:load

## Documentation
docs: ## Generate documentation
	@echo "$(GREEN)[DOCS]$(NC) Generating documentation..."
	@npm run docs:generate

docs-serve: ## Serve documentation
	@echo "$(GREEN)[DOCS]$(NC) Serving documentation..."
	@npm run docs:serve

# Validation targets
.PHONY: validate-node validate-npm validate-docker

validate-node:
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Error: Node.js is not installed$(NC)"; exit 1; }

validate-npm:
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)Error: npm is not installed$(NC)"; exit 1; }

validate-docker:
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Error: Docker is not installed$(NC)"; exit 1; }

# Add validation as prerequisites for relevant targets
dev: validate-node validate-npm
build: validate-node validate-npm
docker-build: validate-docker
docker-up: validate-docker
docker-down: validate-docker