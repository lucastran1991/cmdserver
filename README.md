# CMD Server

A deployment management system with FastAPI backend and Next.js frontend.

## Architecture

- **Backend**: FastAPI with SQLAlchemy, FastAPI-Users for authentication
- **Frontend**: Next.js with TypeScript, Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL (SQLite for development)
- **Authentication**: JWT tokens with custom token caching
- **Deployment**: Docker containers with multi-stage builds

## Quick Start

### Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.app:app --reload

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
# Make scripts executable
chmod +x scripts/docker-build.sh scripts/docker-run.sh

# Build Docker images
./scripts/docker-build.sh

# Run in development mode
./scripts/docker-run.sh dev

# Run in production mode
./scripts/docker-run.sh prod
```

## API Documentation

The API client is located at `frontend/src/lib/api.ts` and provides:

- Authentication methods (login, register, logout)
- Target management (CRUD operations)
- Deployment operations (restart, pull sources, clear cache)
- Log streaming capabilities
- Automatic token management

## Docker Setup

### Quick Start

```bash
# Make scripts executable
chmod +x scripts/docker-build.sh scripts/docker-run.sh

# Build Docker images
./scripts/docker-build.sh

# Run in development mode
./scripts/docker-run.sh dev

# Run in production mode
./scripts/docker-run.sh prod
```

### Manual Docker Commands

```bash
# Build production image
docker build -t cmdserver:latest .

# Run with docker-compose
docker-compose up -d

# Run development environment
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_DB=cmdserver
POSTGRES_USER=cmdserver
POSTGRES_PASSWORD=cmdserver_password

# NextAuth
NEXTAUTH_URL=http://localhost:8888
NEXTAUTH_SECRET=your-secret-key-here

# API
API_BASE_URL=http://localhost:8000
```

### Accessing Services

- Frontend: http://localhost:8888
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Development

The development setup includes:
- Hot reload for both frontend and backend
- Volume mounts for live code editing
- Separate containers for each service
- Development dependencies included

### Production

The production setup includes:
- Optimized multi-stage build
- Combined frontend and backend in single container
- Health checks
- Restart policies
- Minimal image size