#!/bin/bash

# GramCare Development Setup Script
# This script sets up the development environment for GramCare

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_VERSION="16.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    
    print_success "All dependencies installed successfully"
}

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Copy example environment file if .env doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please edit .env file with your actual API keys and configuration"
        else
            print_warning ".env.example not found. You'll need to create .env manually"
        fi
    else
        print_success ".env file already exists"
    fi
    
    # Setup server environment
    if [ ! -f "server/.env" ]; then
        if [ -f "server/.env.example" ]; then
            cp server/.env.example server/.env
            print_success "Created server/.env file from server/.env.example"
        fi
    fi
    
    # Setup client environment
    if [ ! -f "client/.env" ]; then
        cat > client/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
REACT_APP_ENABLE_VOICE=true
REACT_APP_ENABLE_ANALYTICS=true
EOF
        print_success "Created client/.env file with default development settings"
    fi
}

# Function to create necessary directories
setup_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p server/logs
    mkdir -p server/uploads
    mkdir -p server/temp
    mkdir -p client/build
    
    print_success "Directories created successfully"
}

# Function to check for required tools
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command_exists node; then
        missing_tools+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_tools+=("npm")
    fi
    
    if ! command_exists git; then
        missing_tools+=("git")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_status "Please install the missing tools and run this script again"
        exit 1
    fi
    
    check_node_version || exit 1
    
    print_success "All prerequisites are satisfied"
}

# Function to setup Git hooks (optional)
setup_git_hooks() {
    if [ -d ".git" ]; then
        print_status "Setting up Git hooks..."
        
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# GramCare pre-commit hook

echo "Running pre-commit checks..."

# Check for secrets in staged files
if git diff --cached --name-only | xargs grep -l "API_KEY\|SECRET\|PASSWORD\|TOKEN" 2>/dev/null; then
    echo "ERROR: Potential secrets found in staged files!"
    echo "Please remove secrets before committing."
    exit 1
fi

# Run linting (if available)
if command -v npm >/dev/null 2>&1; then
    cd server && npm run lint --silent 2>/dev/null || true
    cd ../client && npm run lint --silent 2>/dev/null || true
fi

echo "Pre-commit checks passed!"
EOF
        
        chmod +x .git/hooks/pre-commit
        print_success "Git hooks setup completed"
    fi
}

# Function to validate setup
validate_setup() {
    print_status "Validating setup..."
    
    local errors=()
    
    # Check if node_modules exist
    if [ ! -d "server/node_modules" ]; then
        errors+=("Server dependencies not installed")
    fi
    
    if [ ! -d "client/node_modules" ]; then
        errors+=("Client dependencies not installed")
    fi
    
    # Check if environment files exist
    if [ ! -f "server/.env" ] && [ ! -f ".env" ]; then
        errors+=("Environment configuration missing")
    fi
    
    if [ ${#errors[@]} -ne 0 ]; then
        print_error "Setup validation failed:"
        for error in "${errors[@]}"; do
            echo "  - $error"
        done
        exit 1
    fi
    
    print_success "Setup validation passed"
}

# Function to display next steps
show_next_steps() {
    print_success "\n🎉 Development setup completed successfully!"
    echo
    print_status "Next steps:"
    echo "  1. Edit your .env files with actual API keys:"
    echo "     - Google Cloud Project ID and credentials"
    echo "     - Twilio Account SID and Auth Token"
    echo "     - Other required configuration"
    echo
    echo "  2. Start the development servers:"
    echo "     ./scripts/dev-start.sh"
    echo
    echo "  3. Or start them manually:"
    echo "     # Terminal 1 - Server"
    echo "     cd server && npm run dev"
    echo
    echo "     # Terminal 2 - Client"
    echo "     cd client && npm start"
    echo
    echo "  4. Open your browser and navigate to:"
    echo "     http://localhost:3000"
    echo
    print_status "For more information, see README.md"
}

# Main execution
main() {
    echo "=================================="
    echo "  GramCare Development Setup"
    echo "=================================="
    echo
    
    check_prerequisites
    setup_directories
    setup_environment
    install_dependencies
    setup_git_hooks
    validate_setup
    show_next_steps
}

# Run main function
main "$@"