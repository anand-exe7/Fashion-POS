# Daddy's Home POS

A modern, fast Point of Sale (POS) system built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4.

## Overview

Daddy's Home POS is designed to handle catalog management, order processing, invoice generation, and sales analytics. Initially built with browser-based `localStorage` for data persistence, the project is currently in the process of migrating to a robust backend using **Supabase** (PostgreSQL) to enable cross-device synchronization, reliable invoice sharing, and centralized data management.

## Tech Stack

- **Framework:** [Next.js 16.2.9](https://nextjs.org/) (App Router)
- **UI Library:** [React 19.2.4](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Language:** TypeScript
- **Icons:** Lucide React
- **Backend (Upcoming):** Supabase (PostgreSQL)

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm or yarn

### Installation

1. **Clone the repository and install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Setup:**

   Copy the sample environment file to create your local `.env`:

   ```bash
   cp .env.example .env
   ```

   *Note: If you are working on the Supabase migration, you will need to add your `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the `.env` file.*

3. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to see the POS system.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.

## Supabase Backend Migration

This project is currently migrating from local storage to a Supabase backend to enable multi-device sync and persistent invoice sharing.

For detailed information on the migration strategy, data models, and implementation steps, please read the [SUPABASE_BACKEND_PLAN.md](./SUPABASE_BACKEND_PLAN.md).

## Agents & Automation

If you are an AI assistant working on this project, please read `AGENTS.md` before making any code changes, as this project uses a specific version of Next.js with potentially breaking changes from standard training data.
