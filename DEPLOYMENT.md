# Deployment Guide

This guide provides detailed instructions for deploying the Marketing Tool application to Vercel.

## Table of Contents

- [Current Deployment Status](#current-deployment-status)
- [Prerequisites](#prerequisites)
- [Backend Deployment on Vercel](#backend-deployment-on-vercel)
- [Frontend Deployment on Vercel](#frontend-deployment-on-vercel)
- [Database Migration](#database-migration)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Current Deployment Status

The marketing tool is currently deployed to Vercel with the following setup:

- **Frontend**: https://marketing-tool-frontend.vercel.app
- **Backend API**: https://marketing-tool-backend.vercel.app

Both the frontend and backend are deployed as separate projects from the same Git repository.

## Prerequisites

Before deploying to Vercel, you need:

1. **GitHub Repository**
   - The codebase should be pushed to GitHub
   - Vercel will connect to this repository for deployments

2. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com) if you don't have an account
   - Connect your GitHub account to Vercel

3. **PostgreSQL Database**
   - For production, you'll need a PostgreSQL database
   - Recommended options:
     - [Neon](https://neon.tech) (Serverless PostgreSQL)
     - [Supabase](https://supabase.com) (PostgreSQL with additional features)
     - [Railway](https://railway.app) (Managed PostgreSQL)

## Backend Deployment on Vercel

### Step 1: Create a New Vercel Project for the Backend

1. **Go to the Vercel Dashboard**
   - Click on "Add New"
   - Select "Project"

2. **Import Git Repository**
   - Select the repository that contains your marketing tool code
   - Click "Import"

3. **Configure Project Settings**
   - **Project Name**: "marketing-tool-backend" (or your preferred name)
   - **Framework Preset**: Select "Other" (since we're using FastAPI)
   - **Root Directory**: Leave as is (pointing to the root of the repository)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: `pip install -r requirements.txt`

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add all variables from your `.env` file, including:
     - `DATABASE_URL`: PostgreSQL connection string (update from SQLite)
     - `SECRET_KEY`: Your JWT secret key
     - `ALGORITHM`: JWT algorithm (typically "HS256")
     - `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time
     - Any other API keys or credentials needed

5. **Verify the vercel.json File**
   - Ensure your repository has a `vercel.json` file in the root with this content:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "app/main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app/main.py"
       }
     ]
   }
   ```

6. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your backend API
   - Once completed, you'll get a URL for your API

### Step 2: Verify Backend Deployment

1. **Test API Endpoints**
   - Access `https://your-backend-url.vercel.app/` to see the welcome message
   - Access `https://your-backend-url.vercel.app/docs` to view the API documentation

2. **Check Database Connection**
   - Verify that the API can connect to your PostgreSQL database
   - Test an endpoint that requires database access

## Frontend Deployment on Vercel

### Step 1: Create a New Vercel Project for the Frontend

1. **Go to the Vercel Dashboard**
   - Click on "Add New"
   - Select "Project"

2. **Import Git Repository**
   - Select the same repository used for the backend
   - Click "Import"

3. **Configure Project Settings**
   - **Project Name**: "marketing-tool-frontend" (or your preferred name)
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: Set to `frontend` 
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps`

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add the following variables:
     - `VITE_API_URL`: Your deployed backend URL (e.g., "https://marketing-tool-backend.vercel.app")
     - `VITE_APP_BASE_URL`: Your frontend URL (will be provided by Vercel)

5. **Verify the vercel.json File**
   - Ensure your `frontend` directory has a `vercel.json` file with this content:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install --legacy-peer-deps",
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://marketing-tool-backend.vercel.app/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

6. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend application
   - Once completed, you'll get a URL for your application

### Step 2: Verify Frontend Deployment

1. **Test Application Access**
   - Access your Vercel-provided URL to ensure the application loads
   - Try logging in to verify authentication is working

2. **Check API Communication**
   - Verify that the frontend can communicate with the backend API
   - Test features that require API requests

## Database Migration

Since Vercel uses serverless functions which don't support persistent file storage, you'll need to migrate from SQLite to PostgreSQL for production:

### Step 1: Set Up PostgreSQL Database

1. **Create a PostgreSQL Database**
   - Sign up for a cloud PostgreSQL service (Neon, Supabase, Railway, etc.)
   - Create a new database instance
   - Get the connection string (format: `postgresql://username:password@hostname:port/database`)

### Step 2: Migrate Data

There are several options for migrating data:

#### Option 1: Use Alembic Migrations

1. **Update DATABASE_URL**
   - Set your local `.env` file to use the PostgreSQL connection string

2. **Run Migrations**
   ```bash
   alembic upgrade head
   ```

3. **Import Data**
   - Use the provided scripts to import your existing data:
   ```bash
   python export-db.py  # Export data from SQLite
   # Modify the script to import to PostgreSQL
   python import-to-postgres.py  # Create this script to import to PostgreSQL
   ```

#### Option 2: Manual Data Import

1. **Export Data to CSV/JSON**
   ```bash
   python export-db.py --format=json
   ```

2. **Import Data to PostgreSQL**
   - Write a script that connects to PostgreSQL and imports the data
   - Use the SQLAlchemy models to ensure data integrity

### Step 3: Update Backend Configuration

1. **Update DATABASE_URL Environment Variable**
   - In the Vercel project settings for your backend, set `DATABASE_URL` to the PostgreSQL connection string

2. **Verify Database Connection**
   - Deploy the backend with the updated environment variable
   - Test endpoints to ensure the database connection works

## Environment Variables

### Required Backend Environment Variables

| Variable                    | Description                                | Example Value                                          |
|-----------------------------|--------------------------------------------|--------------------------------------------------------|
| DATABASE_URL                | PostgreSQL connection string               | postgresql://user:pass@host:port/db                    |
| SECRET_KEY                  | JWT secret key                             | your-secure-secret-key                                 |
| ALGORITHM                   | JWT algorithm                              | HS256                                                  |
| ACCESS_TOKEN_EXPIRE_MINUTES | JWT token expiration time in minutes       | 30                                                     |

### Required Frontend Environment Variables

| Variable          | Description                      | Example Value                                  |
|-------------------|----------------------------------|------------------------------------------------|
| VITE_API_URL      | Backend API URL                  | https://marketing-tool-backend.vercel.app      |
| VITE_APP_BASE_URL | Frontend application URL         | https://marketing-tool-frontend.vercel.app     |

## Troubleshooting

### Common Backend Deployment Issues

1. **Database Connection Errors**
   - Verify the PostgreSQL connection string format
   - Check that the database server allows connections from Vercel
   - Ensure the database user has appropriate permissions

2. **Missing Environment Variables**
   - Check that all required environment variables are set in Vercel
   - Verify the values are correct (no typos or formatting issues)

3. **Deployment Build Failures**
   - Check the build logs in Vercel for specific errors
   - Ensure all dependencies are listed in `requirements.txt`
   - Verify that `vercel.json` is formatted correctly

### Common Frontend Deployment Issues

1. **API Connection Issues**
   - Verify that `VITE_API_URL` points to the correct backend URL
   - Check that the backend allows CORS from the frontend domain
   - Look for network errors in the browser console

2. **Build Failures**
   - Check for TypeScript or ESLint errors in the build logs
   - Ensure all dependencies are compatible
   - Use `--legacy-peer-deps` flag if needed for dependency resolution

3. **Routing Issues**
   - Verify that the `vercel.json` rewrites are configured correctly
   - Check that client-side routing works properly

## Redeployment Process

### Updating the Backend

1. **Make Changes to the Backend Code**
   - Update your codebase locally
   - Test changes locally before pushing

2. **Push Changes to GitHub**
   - Commit and push changes to your repository
   - Vercel will automatically detect changes and initiate a new deployment

3. **Verify Deployment**
   - Check the Vercel dashboard for deployment status
   - Test the updated API endpoints

### Updating the Frontend

1. **Make Changes to the Frontend Code**
   - Update your frontend code locally
   - Test changes locally before pushing

2. **Push Changes to GitHub**
   - Commit and push changes to your repository
   - Vercel will automatically detect changes and initiate a new deployment

3. **Verify Deployment**
   - Check the Vercel dashboard for deployment status
   - Test the updated frontend application 