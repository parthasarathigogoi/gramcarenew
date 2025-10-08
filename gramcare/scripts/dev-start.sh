#!/bin/bash

# GramCare Development Start Script
# This script starts both server and client in development mode

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

print_server() {
    echo -e "${PURPLE}[SERVER]${NC} $1"
}

print_client() {
    echo -e "${CYAN}[CLIENT]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        print_warning "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the GramCare root directory"
        exit 1
    fi
    
    # Check if dependencies are installed (check package.json and try to verify installation)
    if [ ! -f "server/package.json" ]; then
        print_error "Server package.json not found"
        exit 1
    fi
    
    if [ ! -f "client/package.json" ]; then
        print_error "Client package.json not found"
        exit 1
    fi
    
    # Try to check if npm can find the dependencies (works with workspaces)
    cd server
    if ! npm list express >/dev/null 2>&1; then
        print_error "Server dependencies not properly installed. Run: cd server && npm install"
        cd ..
        exit 1
    fi
    cd ..
    
    cd client
    if ! npm list react >/dev/null 2>&1; then
        print_error "Client dependencies not properly installed. Run: cd client && npm install"
        cd ..
        exit 1
    fi
    cd ..
    
    # Check environment files
    if [ ! -f "server/.env" ] && [ ! -f ".env" ]; then
        print_warning "No environment file found. Creating default .env files..."
        
        # Create basic server .env
        cat > server/.env << EOF
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
EOF
        
        # Create basic client .env
        cat > client/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
REACT_APP_ENABLE_VOICE=true
REACT_APP_ENABLE_ANALYTICS=true
EOF
        
        print_success "Created basic .env files"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to cleanup on exit
cleanup() {
    print_status "\nShutting down servers..."
    
    # Kill background jobs
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill processes on our ports
    kill_port 5000  # Server port
    kill_port 3000  # Client port
    
    print_success "Cleanup completed"
    exit 0
}

# Function to start server
start_server() {
    print_server "Starting server on port 5000..."
    
    cd server
    
    # Check if server port is available
    if check_port 5000; then
        print_warning "Port 5000 is already in use"
        print_warning "Killing existing process on port 5000..."
        kill_port 5000
    fi
    
    # Start server in background
    npm run dev 2>&1 | sed 's/^/[SERVER] /' &
    SERVER_PID=$!
    
    cd ..
    
    # Wait a bit for server to start
    sleep 3
    
    # Check if server is running
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_success "Server started successfully (PID: $SERVER_PID)"
    else
        print_error "Failed to start server"
        exit 1
    fi
}

# Function to start client
start_client() {
    print_client "Starting client on port 3000..."
    
    cd client
    
    # Check if client port is available
    if check_port 3000; then
        print_warning "Port 3000 is already in use"
        print_warning "Killing existing process on port 3000..."
        kill_port 3000
    fi
    
    # Start client in background
    BROWSER=none npm start 2>&1 | sed 's/^/[CLIENT] /' &
    CLIENT_PID=$!
    
    cd ..
    
    # Wait a bit for client to start
    sleep 5
    
    # Check if client is running
    if kill -0 $CLIENT_PID 2>/dev/null; then
        print_success "Client started successfully (PID: $CLIENT_PID)"
    else
        print_error "Failed to start client"
        exit 1
    fi
}

# Function to wait for servers to be ready
wait_for_servers() {
    print_status "Waiting for servers to be ready..."
    
    # Wait for server
    local server_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:5000/health >/dev/null 2>&1; then
            server_ready=true
            break
        fi
        sleep 1
    done
    
    if [ "$server_ready" = true ]; then
        print_success "Server is ready at http://localhost:5000"
    else
        print_warning "Server health check failed, but it might still be starting..."
    fi
    
    # Wait for client
    local client_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            client_ready=true
            break
        fi
        sleep 1
    done
    
    if [ "$client_ready" = true ]; then
        print_success "Client is ready at http://localhost:3000"
    else
        print_warning "Client health check failed, but it might still be starting..."
    fi
}

# Function to show running info
show_info() {
    echo
    echo "=================================="
    echo "  🚀 GramCare Development Servers"
    echo "=================================="
    echo
    print_success "Servers are running!"
    echo
    echo "📱 Client (React):     http://localhost:3000"
    echo "🔧 Server (Express):   http://localhost:5000"
    echo "📊 API Docs:          http://localhost:5000/api-docs"
    echo "💾 Health Check:      http://localhost:5000/health"
    echo
    echo "📋 Available Pages:"
    echo "   • Chat Interface:   http://localhost:3000/chat"
    echo "   • Health Alerts:    http://localhost:3000/alerts"
    echo "   • Dashboard:        http://localhost:3000/dashboard"
    echo "   • Admin Panel:      http://localhost:3000/admin"
    echo "   • About Page:       http://localhost:3000/about"
    echo
    print_status "Press Ctrl+C to stop all servers"
    echo
}

# Function to monitor servers
monitor_servers() {
    while true; do
        # Check if server is still running
        if ! kill -0 $SERVER_PID 2>/dev/null; then
            print_error "Server process died unexpectedly"
            cleanup
        fi
        
        # Check if client is still running
        if ! kill -0 $CLIENT_PID 2>/dev/null; then
            print_error "Client process died unexpectedly"
            cleanup
        fi
        
        sleep 5
    done
}

# Function to open browser (optional)
open_browser() {
    if command -v open >/dev/null 2>&1; then
        # macOS
        sleep 2
        open http://localhost:3000
    elif command -v xdg-open >/dev/null 2>&1; then
        # Linux
        sleep 2
        xdg-open http://localhost:3000
    elif command -v start >/dev/null 2>&1; then
        # Windows
        sleep 2
        start http://localhost:3000
    fi
}

# Main execution
main() {
    echo "=================================="
    echo "  GramCare Development Starter"
    echo "=================================="
    echo
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    check_prerequisites
    start_server
    start_client
    wait_for_servers
    show_info
    
    # Ask if user wants to open browser
    read -p "Open browser automatically? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        open_browser &
    fi
    
    # Monitor servers
    monitor_servers
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-browser)
            NO_BROWSER=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --no-browser    Don't open browser automatically"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"