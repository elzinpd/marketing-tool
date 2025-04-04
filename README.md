# Marketing Tool

A comprehensive marketing tool for managing campaigns across multiple platforms.

## Features

- Campaign management
- LinkedIn integration
- Rollworks integration
- User authentication
- Campaign metrics tracking

## Development Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=your_redirect_uri
ROLLWORKS_API_KEY=your_api_key
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./marketing_tool.db
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure the following environment variables in Vercel:
   - LINKEDIN_CLIENT_ID
   - LINKEDIN_CLIENT_SECRET
   - LINKEDIN_REDIRECT_URI
   - ROLLWORKS_API_KEY
   - SECRET_KEY
   - DATABASE_URL

4. Deploy!

### Local Production

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the production server:
```bash
./start.sh
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT 