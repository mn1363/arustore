#!/bin/bash

echo "🚀 AruStore Project Setup"
echo "=========================="

# Create project structure
mkdir -p arustore/{backend,frontend}

# Setup Backend
echo "📦 Setting up Backend..."
cd arustore/backend
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn[standard] sqlalchemy asyncpg pydantic-settings \
    python-jose[cryptography] passlib[bcrypt] python-multipart \
    elasticsearch async-redis celery flower \
    boto3 pillow unidecode email-validator

# Create initial files
mkdir -p app/{api/v1/endpoints,core,models,schemas,services,tasks,utils}
touch app/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/api/v1/endpoints/__init__.py

# Setup Frontend
echo "📦 Setting up Frontend..."
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --eslint
npm install @tanstack/react-query axios zustand react-hook-form \
    @hookform/resolvers zod lucide-react framer-motion \
    next-pwa @types/node

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd arustore"
echo "2. docker-compose up -d"
echo "3. Access Backend API at http://localhost:8000/docs"
echo "4. Access Frontend at http://localhost:3000"
echo ""
echo "Happy coding! 🎉"