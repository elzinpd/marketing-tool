# Database Fix Utility

This utility script (`fix-database.py`) helps maintain database consistency in the Marketing Tool application.

## Purpose

The script performs the following functions:
1. Checks if all required database tables exist based on the SQLAlchemy models
2. Creates missing tables if necessary
3. Ensures an admin user exists
4. Creates a demo client and campaign if they don't exist

## Usage

Run the script from the project root directory:

```
python fix-database.py
```

## When to Use

Run this script when:
- Setting up the application for the first time
- After pulling new code that might have model changes
- When experiencing database-related errors
- When database tables are missing or corrupted

## Troubleshooting

If you encounter database errors after running this script:

1. Consider resetting the database completely:
   ```
   # Remove database files
   Remove-Item -Path "marketing_tool.db" -Force -ErrorAction SilentlyContinue
   Remove-Item -Path "app.db" -Force -ErrorAction SilentlyContinue
   
   # Run fix script again
   python fix-database.py
   ```

2. Check for import errors:
   - Make sure you're running the script from the project root
   - Ensure PYTHONPATH is set correctly: `$env:PYTHONPATH = "."`

3. Check for model inconsistencies:
   - Compare models in `app/db/models.py` with actual database schema
   - Look for missing columns or relationships

## How It Works

The script:
1. Connects to the database specified in settings
2. Compares existing tables with those defined in the models
3. Creates tables using SQLAlchemy's `create_all()`
4. Checks for and creates the admin user if missing
5. Creates a demo client and campaign if missing

## Logs

The script outputs detailed logs to help diagnose issues. 