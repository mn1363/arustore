# برو به پوشه frontend
cd "F:\MOSTAFA Project\arustore\frontend"

# ساخت پوشه‌ها
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "app/(main)" | Out-Null
New-Item -ItemType Directory -Force -Path "app/(auth)" | Out-Null
New-Item -ItemType Directory -Force -Path "components/ui" | Out-Null
New-Item -ItemType Directory -Force -Path "styles" | Out-Null
New-Item -ItemType Directory -Force -Path "public" | Out-Null

# ساخت فایل layout.tsx
Write-Host "Creating layout.tsx..." -ForegroundColor Yellow
@"
import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'AruStore',
  description: 'Premium E-commerce Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
"@ | Out-File -FilePath "app/layout.tsx" -Encoding UTF8 -Force

# ساخت فایل page.tsx
Write-Host "Creating page.tsx..." -ForegroundColor Yellow
@"
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AruStore
        </h1>
        <p className="text-gray-600">Premium E-commerce Platform</p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/api" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            API Docs
          </a>
          <a href="/admin" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            Admin Panel
          </a>
        </div>
      </div>
    </div>
  )
}
"@ | Out-File -FilePath "app/page.tsx" -Encoding UTF8 -Force

# ساخت فایل globals.css
Write-Host "Creating globals.css..." -ForegroundColor Yellow
@"
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}
"@ | Out-File -FilePath "styles/globals.css" -Encoding UTF8 -Force

# ساخت فایل package.json
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
"@ | Out-File -FilePath "package.json" -Encoding UTF8 -Force

# ساخت فایل next.config.js
Write-Host "Creating next.config.js..." -ForegroundColor Yellow
@"
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
"@ | Out-File -FilePath "next.config.js" -Encoding UTF8 -Force

# ساخت فایل tailwind.config.js
Write-Host "Creating tailwind.config.js..." -ForegroundColor Yellow
@"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a1a',
        accent: '#4a90d9',
      },
    },
  },
  plugins: [],
}
"@ | Out-File -FilePath "tailwind.config.js" -Encoding UTF8 -Force

# ساخت فایل postcss.config.js
Write-Host "Creating postcss.config.js..." -ForegroundColor Yellow
@"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@ | Out-File -FilePath "postcss.config.js" -Encoding UTF8 -Force

# ساخت فایل tsconfig.json
Write-Host "Creating tsconfig.json..." -ForegroundColor Yellow
@"
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"@ | Out-File -FilePath "tsconfig.json" -Encoding UTF8 -Force

# ساخت فایل Dockerfile
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
"@ | Out-File -FilePath "Dockerfile" -Encoding UTF8 -Force

Write-Host "`nAll files created successfully!" -ForegroundColor Green
Write-Host "`nNow run: npm install" -ForegroundColor Yellow