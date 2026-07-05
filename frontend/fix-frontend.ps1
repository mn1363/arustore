# fix-frontend.ps1
Write-Host "Fixing Frontend..." -ForegroundColor Yellow

Set-Location "F:\MOSTAFA Project\arustore\frontend"

# Create package.json if missing
if (-not (Test-Path "package.json")) {
    Write-Host "Creating package.json..." -ForegroundColor Yellow
    @"
{
  "name": "arustore-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "eslint-config-next": "14.0.3",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.3.2"
  }
}
"@ | Out-File -FilePath package.json -Encoding UTF8 -Force
}

# Install dependencies and create lock file
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Create Dockerfile
Write-Host "Creating Dockerfile..." -ForegroundColor Yellow
@"
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
"@ | Out-File -FilePath Dockerfile -Encoding UTF8 -Force

# Build and run
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t arustore-frontend .

Write-Host "Stopping old container..." -ForegroundColor Yellow
docker stop frontend 2>$null
docker rm frontend 2>$null

Write-Host "Running container..." -ForegroundColor Yellow
docker run -d --name frontend -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 arustore-frontend

Write-Host "Done! Check logs: docker logs frontend" -ForegroundColor Green