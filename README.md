# Marketing Tool

A comprehensive marketing tool for managing clients, campaigns, and generating reports. The application features a FastAPI backend and React frontend.

## Features

- User authentication and role-based access control
- Client management
- Campaign tracking and analytics
- PowerPoint report generation
- LinkedIn integration

## Tech Stack

### Backend

- FastAPI (Python)
- SQLite database (Development) / PostgreSQL (Production)
- SQLAlchemy ORM
- JWT authentication
- Python-PPTX for report generation

### Frontend

- React with TypeScript
- Vite build tool
- Material UI components
- Axios for API requests
- React Router for navigation
- Recharts for data visualization

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (for production) or SQLite (for development)

### Local Development Setup

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/marketing-tool.git
   cd marketing-tool
   ```

2. **Set up environment variables**
   ```
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
   Edit the `.env` files with your configuration.

3. **Set up the backend**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set up the database**
   ```
   # Run migrations to create the database schema
   alembic upgrade head

   # Seed the database with initial data (if available)
   python -m app.db.init_db
   ```

5. **Start the backend server**
   ```
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   On Windows PowerShell:
   ```
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Set up the frontend**
   ```
   cd frontend
   npm install
   ```

7. **Start the frontend development server**
   ```
   npm run dev -- --port 5175
   ```

   On Windows PowerShell:
   ```
   cd frontend
   npm run dev -- --port 5175
   ```

   The application will be available at http://localhost:5175

### Docker Setup

If you prefer using Docker:

```
docker-compose up --build
```

This will start the PostgreSQL database, backend API, and frontend application. The frontend will be available at http://localhost:5175 and the API at http://localhost:8000.

## Deployment

The application is configured for deployment on Vercel with separate projects for frontend and backend.

### Current Deployed URLs

- **Frontend**: https://marketing-tool-frontend.vercel.app
- **Backend API**: https://marketing-tool-backend.vercel.app

### Vercel Deployment

Both the frontend and backend applications are deployed to Vercel:

1. **Backend Deployment (Python/FastAPI)**
   - Deploy as a separate Vercel project
   - Framework Preset: Other
   - Root Directory: /
   - Build Command: (empty)
   - Output Directory: (empty)
   - Install Command: `pip install -r requirements.txt`
   - Environment Variables:
     - All variables from `.env` file, with appropriate production values
     - Update `DATABASE_URL` to point to a cloud PostgreSQL instance

2. **Frontend Deployment (Vite/React)**
   - Deploy as a separate Vercel project
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`
   - Environment Variables:
     - `VITE_API_URL`: Backend API URL (https://marketing-tool-backend.vercel.app)
     - `VITE_APP_BASE_URL`: Frontend URL (https://marketing-tool-frontend.vercel.app)

For detailed deployment instructions, see the [Deployment Guide](DEPLOYMENT.md).

## Project Structure

```
marketing-tool/
├── app/                    # Backend application code
│   ├── api/                # API endpoints
│   ├── core/               # Core configuration
│   ├── db/                 # Database models and session
│   └── services/           # Business logic
├── frontend/               # Frontend React application
│   ├── public/             # Static assets
│   │   └── dev-scripts/    # Development scripts (not for production)
│   └── src/                # Source code
│       ├── components/     # React components
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components
│       └── services/       # API service calls
├── alembic/                # Database migrations
├── reports/                # Generated reports
├── dev-tools/              # Development tools (not for production)
├── vercel.json             # Backend Vercel configuration
├── frontend/vercel.json    # Frontend Vercel configuration
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Backend Dockerfile
└── README.md               # This file
```

## Development Tools

The project includes several development tools to help with debugging and testing:

### Backend Development Tools

Located in the `dev-tools/` directory:

- **test_login.py**: A Python script to test the login functionality of the backend API
- **api_test.html**: An HTML page to test API endpoints
- **login.html**: A standalone HTML login page for testing authentication

### Frontend Development Scripts

Located in the `frontend/public/dev-scripts/` directory:

- **fix-share-modal.js**: Prevents errors with the share modal functionality
- **share-modal.js**: Initializes the share modal functionality
- **test-api.js**: Tests API connectivity
- **login-fix.js**: Adds a login helper to the frontend

> **Note**: These development tools are excluded from Git by the `.gitignore` file and should not be included in production deployments.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Database Management

### Adding and Editing Data

There are several ways to manage data in your PostgreSQL database:

#### 1. Using SQLAlchemy Models (Recommended for Development)

Use the `add_initial_data.py` script to add structured data using SQLAlchemy models:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_NXFBy1oxT3SM@ep-restless-paper-a6aurzkv-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"; python add_initial_data.py
```

This script creates:
- An admin user
- A test client
- A sample campaign
- A test report
- User-client associations

#### 2. Using Direct SQL Commands

For quick edits or specific SQL queries, use the `run_sql.py` script:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_NXFBy1oxT3SM@ep-restless-paper-a6aurzkv-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"; python run_sql.py
```

Example SQL commands:
```sql
-- View all clients
SELECT * FROM clients;

-- Add a new client
INSERT INTO clients (name, campaign_keywords, is_active) VALUES ('New Client', 'marketing,seo', true);

-- Update a client
UPDATE clients SET campaign_keywords = 'marketing,seo,social' WHERE name = 'New Client';

-- Delete a client
DELETE FROM clients WHERE name = 'New Client';
```

#### 3. Using FastAPI Endpoints (Recommended for Production)

For production use, always use the FastAPI endpoints to ensure:
- Data validation
- Business logic enforcement
- Security measures
- Proper error handling

### Best Practices

1. **Development Environment**:
   - Use `add_initial_data.py` for structured data
   - Use `run_sql.py` for quick edits and testing

2. **Production Environment**:
   - Always use FastAPI endpoints
   - Never modify data directly in the database
   - Use proper authentication and authorization

3. **Data Integrity**:
   - Always back up data before making changes
   - Use transactions for multiple related operations
   - Test changes in a development environment first

4. **Security**:
   - Never store plain text passwords
   - Use environment variables for sensitive data
   - Follow the principle of least privilege