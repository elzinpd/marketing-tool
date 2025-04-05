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
- PostgreSQL database
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
- PostgreSQL (or Docker)

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

6. **Set up the frontend**
   ```
   cd frontend
   npm install
   ```

7. **Start the frontend development server**
   ```
   npm start
   ```
   The application will be available at http://localhost:5175

### Docker Setup

If you prefer using Docker:

```
docker-compose up --build
```

This will start the PostgreSQL database, backend API, and frontend application. The frontend will be available at http://localhost:5175 and the API at http://localhost:8000.

## Deployment

### Deploying to a Cloud Provider

The project includes configuration files for deploying to various cloud providers:

1. **Vercel** (for the frontend)
   - Connect your GitHub repository to Vercel
   - Set environment variables in the Vercel dashboard
   - Deploy with the default settings

2. **Railway/Render/DigitalOcean** (for the backend)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy the Docker container

See the [Deployment Guide](DEPLOYMENT.md) for detailed instructions.

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
│   └── src/                # Source code
│       ├── components/     # React components
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components
│       └── services/       # API service calls
├── migrations/             # Database migrations
├── reports/                # Generated reports
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Backend Dockerfile
└── README.md               # This file
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 