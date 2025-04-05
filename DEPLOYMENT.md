# Deployment Guide

This guide provides instructions for deploying the Marketing Tool to various cloud platforms.

## Table of Contents

- [General Preparation](#general-preparation)
- [Frontend Deployment](#frontend-deployment)
  - [Vercel](#vercel-frontend)
  - [Netlify](#netlify-frontend)
- [Backend Deployment](#backend-deployment)
  - [Railway](#railway-backend)
  - [Render](#render-backend)
  - [DigitalOcean App Platform](#digitalocean-app-platform)
- [Database Deployment](#database-deployment)

## General Preparation

1. **Prepare your repository**
   - Make sure all your code is committed and pushed to GitHub
   - Verify that your `.gitignore` includes all files with sensitive information
   - Check that your application is working locally

2. **Environment variables**
   - Identify all environment variables needed for production
   - Keep a secure record of these values for deployment

## Frontend Deployment

### Vercel (Frontend)

Vercel is the preferred platform for deploying the frontend, especially if you're using Next.js.

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up or log in
   - Connect your GitHub account

2. **Import your repository**
   - Click "Add New Project"
   - Select your repository
   - Configure the project:
     - Framework preset: Vite
     - Root directory: `frontend`
     - Build command: `npm run build`
     - Output directory: `dist`

3. **Configure environment variables**
   - Add the following environment variables:
     - `VITE_API_URL`: URL of your deployed backend API (e.g., `https://your-api.railway.app`)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend

### Netlify (Frontend)

Netlify is another excellent option for deploying static sites and frontend applications.

1. **Sign up for Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up or log in
   - Connect your GitHub account

2. **Import your repository**
   - Click "New site from Git"
   - Select your repository
   - Configure the build settings:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Configure environment variables**
   - Go to Site settings > Build & deploy > Environment
   - Add the environment variables as with Vercel

4. **Deploy**
   - Click "Deploy site"

## Backend Deployment

### Railway (Backend)

Railway is a modern platform for deploying applications with minimal configuration.

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app) and sign up or log in
   - Connect your GitHub account

2. **Create a new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Configure environment variables**
   - Add all required environment variables from your `.env.example` file
   - Make sure to set `PRODUCTION=true`
   - Update `ALLOWED_ORIGINS` to include your frontend URL

4. **Add a database**
   - Click "New Service" > "Database" > "PostgreSQL"
   - Railway will automatically add the `DATABASE_URL` variable to your project

5. **Configure the service**
   - Root directory: `/`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Render (Backend)

Render is a unified platform for deploying both static sites and backend services.

1. **Sign up for Render**
   - Go to [render.com](https://render.com) and sign up or log in
   - Connect your GitHub account

2. **Create a new Web Service**
   - Click "New" > "Web Service"
   - Select your repository
   - Configure the service:
     - Name: `marketing-tool-api`
     - Environment: Docker
     - Branch: `main`

3. **Configure environment variables**
   - Add all required environment variables from your `.env.example` file
   - Update `ALLOWED_ORIGINS` to include your frontend URL

4. **Add a database**
   - Click "New" > "PostgreSQL"
   - Render will provide you with a `DATABASE_URL` to add to your environment variables

### DigitalOcean App Platform

DigitalOcean App Platform is a PaaS solution for deploying applications.

1. **Sign up for DigitalOcean**
   - Go to [digitalocean.com](https://digitalocean.com) and sign up or log in

2. **Create a new app**
   - Click "Create" > "Apps"
   - Connect your GitHub account and select your repository

3. **Configure the app**
   - Choose the region closest to your users
   - Select "Dockerfile" as the deployment method
   - Set environment variables

4. **Add a database**
   - Add a managed database component to your app
   - Choose PostgreSQL
   - DigitalOcean will provide the connection details as environment variables

## Database Deployment

For most cloud platforms mentioned above, you can use their managed database offerings. However, if you need a standalone database:

### Managed PostgreSQL Options

1. **ElephantSQL**
   - Free tier available
   - Sign up at [elephantsql.com](https://www.elephantsql.com/)
   - Create a new instance and get your connection URL

2. **Supabase**
   - Sign up at [supabase.com](https://supabase.com/)
   - Create a new project
   - Get your PostgreSQL connection string from Settings > Database

3. **AWS RDS**
   - More advanced option with higher scalability
   - Set up through the AWS Console

## Migrating and Seeding the Database

After deploying the database:

1. **Run migrations**
   - Connect to your deployed app's shell or run locally with the production DATABASE_URL:
   ```
   alembic upgrade head
   ```

2. **Seed initial data**
   - For the first deployment, you may need to seed the database:
   ```
   python -m app.db.init_db
   ```

## Continuous Deployment

The repository includes a GitHub Actions workflow for CI/CD, which:

1. Runs tests on both frontend and backend
2. Builds Docker images
3. Pushes images to GitHub Container Registry

To use this with your cloud provider:

1. Set up webhook deployments from GitHub to your cloud provider
2. Or, configure your cloud provider to pull the latest image from GitHub Container Registry

## Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure `ALLOWED_ORIGINS` includes the full URL of your frontend
   - Check that your API requests include the correct headers

2. **Database connection issues**
   - Verify the DATABASE_URL is correctly formatted
   - Check if the database server allows connections from your app's IP

3. **Environment variable problems**
   - Double-check all environment variables are set correctly
   - Some platforms require specific formats for multi-line values

### Getting Help

If you encounter issues with deployment, please:

1. Check the logs in your cloud provider's dashboard
2. Refer to their documentation for platform-specific guidance
3. Open an issue in the GitHub repository with detailed information about the problem 