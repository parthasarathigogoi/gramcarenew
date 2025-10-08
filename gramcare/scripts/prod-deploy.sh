#!/bin/bash

# GramCare Production Deployment Script
# This script builds and deploys the application for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="gramcare"
APP_NAME="gramcare"
VERSION="latest"
DEPLOYMENT_ENV="production"
BACKUP_ENABLED=true
HEALTH_CHECK_TIMEOUT=300

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_build() {
    echo -e "${PURPLE}[BUILD]${NC} $1"
}

print_deploy() {
    echo -e "${CYAN}[DEPLOY]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo
    echo "Commands:"
    echo "  build       Build Docker images"
    echo "  deploy      Deploy to production"
    echo "  rollback    Rollback to previous version"
    echo "  status      Check deployment status"
    echo "  logs        Show application logs"
    echo "  backup      Create database backup"
    echo "  restore     Restore from backup"
    echo "  health      Run health checks"
    echo
    echo "Options:"
    echo "  --env ENV           Deployment environment (default: production)"
    echo "  --version VERSION   Version tag (default: latest)"
    echo "  --registry REGISTRY Docker registry (default: gramcare)"
    echo "  --no-backup        Skip database backup"
    echo "  --force            Force deployment without confirmation"
    echo "  --help, -h         Show this help message"
    echo
    echo "Examples:"
    echo "  $0 build --version v1.2.3"
    echo "  $0 deploy --env staging"
    echo "  $0 rollback --version v1.2.2"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the GramCare root directory"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
        print_warning "No production environment file found"
        print_status "Please create .env.production or .env with production settings"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
    if [ "$BACKUP_ENABLED" = false ]; then
        print_status "Backup disabled, skipping..."
        return 0
    fi
    
    print_status "Creating database backup..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # MongoDB backup
    if docker-compose ps | grep -q mongo; then
        print_status "Backing up MongoDB..."
        docker-compose exec -T mongo mongodump --out /tmp/backup
        docker cp $(docker-compose ps -q mongo):/tmp/backup "$backup_dir/mongodb"
        print_success "MongoDB backup created: $backup_dir/mongodb"
    fi
    
    # Redis backup (if running)
    if docker-compose ps | grep -q redis; then
        print_status "Backing up Redis..."
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp $(docker-compose ps -q redis):/data/dump.rdb "$backup_dir/redis_dump.rdb"
        print_success "Redis backup created: $backup_dir/redis_dump.rdb"
    fi
    
    # Create backup metadata
    cat > "$backup_dir/metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$VERSION",
  "environment": "$DEPLOYMENT_ENV",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF
    
    print_success "Backup completed: $backup_dir"
    echo "$backup_dir" > .last_backup
}

# Function to build Docker images
build_images() {
    print_build "Building Docker images..."
    
    # Build server image
    print_build "Building server image..."
    docker build -t "$DOCKER_REGISTRY/$APP_NAME-server:$VERSION" \
        -f server/Dockerfile \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --build-arg VCS_REF="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
        server/
    
    # Build client image
    print_build "Building client image..."
    docker build -t "$DOCKER_REGISTRY/$APP_NAME-client:$VERSION" \
        -f client/Dockerfile \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --build-arg VCS_REF="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
        client/
    
    print_success "Docker images built successfully"
    
    # Show image sizes
    print_status "Image sizes:"
    docker images | grep "$DOCKER_REGISTRY/$APP_NAME" | grep "$VERSION"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Server tests
    if [ -f "server/package.json" ] && grep -q '"test"' server/package.json; then
        print_status "Running server tests..."
        cd server
        npm test -- --coverage --watchAll=false
        cd ..
    fi
    
    # Client tests
    if [ -f "client/package.json" ] && grep -q '"test"' client/package.json; then
        print_status "Running client tests..."
        cd client
        CI=true npm test -- --coverage --watchAll=false
        cd ..
    fi
    
    print_success "All tests passed"
}

# Function to deploy application
deploy_application() {
    print_deploy "Deploying application..."
    
    # Set environment variables
    export COMPOSE_PROJECT_NAME="$APP_NAME"
    export IMAGE_TAG="$VERSION"
    export DEPLOYMENT_ENV="$DEPLOYMENT_ENV"
    
    # Use production compose file if it exists
    local compose_files="-f docker-compose.yml"
    if [ -f "docker-compose.production.yml" ]; then
        compose_files="$compose_files -f docker-compose.production.yml"
    fi
    
    # Pull latest images (if using registry)
    if [ "$VERSION" != "latest" ] && docker pull "$DOCKER_REGISTRY/$APP_NAME-server:$VERSION" 2>/dev/null; then
        print_status "Using images from registry"
        docker pull "$DOCKER_REGISTRY/$APP_NAME-client:$VERSION"
    fi
    
    # Stop existing containers gracefully
    print_deploy "Stopping existing containers..."
    docker-compose $compose_files down --timeout 30
    
    # Start new containers
    print_deploy "Starting new containers..."
    docker-compose $compose_files up -d
    
    # Wait for services to be ready
    print_deploy "Waiting for services to be ready..."
    sleep 10
    
    print_success "Application deployed successfully"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    # Check server health
    print_status "Checking server health..."
    local server_healthy=false
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if curl -sf http://localhost:5000/health >/dev/null 2>&1; then
            server_healthy=true
            break
        fi
        sleep 5
    done
    
    if [ "$server_healthy" = true ]; then
        print_success "Server is healthy"
    else
        print_error "Server health check failed"
        return 1
    fi
    
    # Check client health
    print_status "Checking client health..."
    local client_healthy=false
    start_time=$(date +%s)
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        if curl -sf http://localhost:3000 >/dev/null 2>&1; then
            client_healthy=true
            break
        fi
        sleep 5
    done
    
    if [ "$client_healthy" = true ]; then
        print_success "Client is healthy"
    else
        print_error "Client health check failed"
        return 1
    fi
    
    # Check database connectivity
    print_status "Checking database connectivity..."
    if docker-compose exec -T server node -e "require('./config/database').connect().then(() => console.log('DB OK')).catch(() => process.exit(1))" >/dev/null 2>&1; then
        print_success "Database is accessible"
    else
        print_warning "Database connectivity check failed"
    fi
    
    print_success "All health checks passed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status"
    echo "=================="
    
    # Show running containers
    echo
    print_status "Running containers:"
    docker-compose ps
    
    # Show resource usage
    echo
    print_status "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    # Show recent logs
    echo
    print_status "Recent logs (last 20 lines):"
    docker-compose logs --tail=20
}

# Function to show logs
show_logs() {
    local service="$1"
    local lines="${2:-100}"
    
    if [ -n "$service" ]; then
        print_status "Showing logs for $service (last $lines lines):"
        docker-compose logs --tail="$lines" -f "$service"
    else
        print_status "Showing all logs (last $lines lines):"
        docker-compose logs --tail="$lines" -f
    fi
}

# Function to rollback deployment
rollback_deployment() {
    local rollback_version="$1"
    
    if [ -z "$rollback_version" ]; then
        print_error "Rollback version not specified"
        exit 1
    fi
    
    print_deploy "Rolling back to version $rollback_version..."
    
    # Update version and redeploy
    VERSION="$rollback_version"
    deploy_application
    run_health_checks
    
    print_success "Rollback completed successfully"
}

# Function to restore from backup
restore_backup() {
    local backup_path="$1"
    
    if [ -z "$backup_path" ]; then
        if [ -f ".last_backup" ]; then
            backup_path=$(cat .last_backup)
        else
            print_error "No backup path specified and no recent backup found"
            exit 1
        fi
    fi
    
    if [ ! -d "$backup_path" ]; then
        print_error "Backup directory not found: $backup_path"
        exit 1
    fi
    
    print_status "Restoring from backup: $backup_path"
    
    # Restore MongoDB
    if [ -d "$backup_path/mongodb" ]; then
        print_status "Restoring MongoDB..."
        docker cp "$backup_path/mongodb" $(docker-compose ps -q mongo):/tmp/restore
        docker-compose exec -T mongo mongorestore --drop /tmp/restore
        print_success "MongoDB restored"
    fi
    
    # Restore Redis
    if [ -f "$backup_path/redis_dump.rdb" ]; then
        print_status "Restoring Redis..."
        docker-compose stop redis
        docker cp "$backup_path/redis_dump.rdb" $(docker-compose ps -q redis):/data/dump.rdb
        docker-compose start redis
        print_success "Redis restored"
    fi
    
    print_success "Restore completed"
}

# Function to cleanup old images and containers
cleanup() {
    print_status "Cleaning up old images and containers..."
    
    # Remove old containers
    docker container prune -f
    
    # Remove old images (keep last 3 versions)
    docker images "$DOCKER_REGISTRY/$APP_NAME-server" --format "{{.Tag}}" | tail -n +4 | xargs -r docker rmi "$DOCKER_REGISTRY/$APP_NAME-server:" 2>/dev/null || true
    docker images "$DOCKER_REGISTRY/$APP_NAME-client" --format "{{.Tag}}" | tail -n +4 | xargs -r docker rmi "$DOCKER_REGISTRY/$APP_NAME-client:" 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Main execution function
main() {
    local command="$1"
    shift || true
    
    case "$command" in
        build)
            check_prerequisites
            build_images
            ;;
        test)
            run_tests
            ;;
        deploy)
            check_prerequisites
            if [ "$FORCE" != true ]; then
                echo
                print_warning "This will deploy $APP_NAME version $VERSION to $DEPLOYMENT_ENV"
                read -p "Continue? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_status "Deployment cancelled"
                    exit 0
                fi
            fi
            create_backup
            build_images
            run_tests
            deploy_application
            run_health_checks
            cleanup
            print_success "Deployment completed successfully!"
            ;;
        rollback)
            local rollback_version="$1"
            rollback_deployment "$rollback_version"
            ;;
        status)
            show_status
            ;;
        logs)
            local service="$1"
            local lines="$2"
            show_logs "$service" "$lines"
            ;;
        backup)
            create_backup
            ;;
        restore)
            local backup_path="$1"
            restore_backup "$backup_path"
            ;;
        health)
            run_health_checks
            ;;
        cleanup)
            cleanup
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Parse command line arguments
COMMAND=""
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            DEPLOYMENT_ENV="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        --no-backup)
            BACKUP_ENABLED=false
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$COMMAND" ]; then
                COMMAND="$1"
            fi
            shift
            ;;
    esac
done

# Show header
echo "=================================="
echo "  GramCare Production Deployment"
echo "=================================="
echo "Environment: $DEPLOYMENT_ENV"
echo "Version: $VERSION"
echo "Registry: $DOCKER_REGISTRY"
echo "=================================="
echo

# Execute command
if [ -z "$COMMAND" ]; then
    show_usage
    exit 1
fi

main "$COMMAND" "$@"