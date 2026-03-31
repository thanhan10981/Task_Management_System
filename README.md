# Task Management System - Frontend

A modern task management frontend built with **Vue 3**, **TypeScript**, and **Vite**.

## Tech Stack

| Tool | Purpose |
|---|---|
| Vue 3 + TypeScript | Core framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| TanStack Query | Server state management & data fetching |
| Pinia | Client state management |
| Vue Router | SPA routing |
| VeeValidate + Zod | Form validation & input handling |
| Zod | API response type validation |
| Biome.js | Linting, formatting, code conventions |
| Husky + lint-staged | Git hook enforcement |

## Project Structure

```
src/
├── api/              # Axios instance & API service functions
├── assets/           # Static assets (images, fonts, icons)
├── components/       # Shared/reusable UI components
│   ├── common/       # Generic components (Button, Input, Modal…)
│   └── layout/       # Layout components (Sidebar, Navbar, Footer)
├── composables/      # Reusable Vue composables (useAuth, useToast…)
├── constants/        # App-wide constants
├── features/         # Feature-based modules (each feature is self-contained)
│   └── [feature]/
│       ├── components/   # Feature-specific components
│       ├── composables/  # Feature-specific composables
│       ├── schemas/      # Zod schemas for validation
│       ├── services/     # API calls for this feature
│       ├── stores/       # Pinia store for this feature
│       ├── types/        # TypeScript types for this feature
│       └── views/        # Page-level components
├── layouts/          # App layout wrappers
├── router/           # Vue Router configuration
├── schemas/          # Global Zod schemas
├── stores/           # Global Pinia stores
├── styles/           # Global CSS / Tailwind entry
├── types/            # Global TypeScript types
└── utils/            # Utility/helper functions
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Type check + build for production
npm run build

# Preview production build
npm run preview
```

## Code Quality

```bash
# Lint source files
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format source files
npm run format

# Run all checks (lint + format)
npm run check

# Auto-fix all issues
npm run check:fix
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in required values:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Task Management System
```
"# Task_Management_System" 
"# Task_Management_System" 
"# Task_Management_System" 
"# Task_Management_System" 
