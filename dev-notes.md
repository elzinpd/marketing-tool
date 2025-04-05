# Development Notes for Marketing Tool

## Windows PowerShell Tips

### Command Execution
- PowerShell uses semicolons (`;`) for command chaining, not `&&`
- Example: `cd frontend; npm start` (not `cd frontend && npm start`)

### Process Management
- List processes: `Get-Process -Name node` 
- Kill processes: `Get-Process -Name node | Stop-Process -Force`
- Find processes using a port: `netstat -ano | findstr :5173`

### Path Variables
- Set environment variables: `$env:PYTHONPATH = "."`

## Database Management

### SQLite Issues
- Two SQLite databases are referenced in the codebase:
  - `app.db` (in `app/db/database.py`)
  - `marketing_tool.db` (in `app/core/config.py`)
- We standardized on `marketing_tool.db`

### Model Inconsistencies
- Original issue: Database model inconsistency between:
  - `app/models/models.py` (used by `init_db.py`)
  - `app/db/models.py` (used elsewhere)
- Solution: Updated `init_db.py` to use models from `app/db/models.py`

## Frontend Development

### Port Configuration
- Default port (5173) can be changed in `package.json`:
```json
"scripts": {
  "start": "vite --port 5174",
  ...
}
```

### NPM Command Line Arguments
- When passing arguments to the underlying command (vite), use `--`:
  - `npm start -- --port 5174`
- Or better: modify the script in package.json directly

## Authentication System

### User Roles
- Available roles: "admin" and "client_manager"
- Role-based access: AdminDashboard requires admin role
- Default admin: admin@example.com / admin123

## Common Errors

### "No Such Column: users.role"
- Cause: Database schema inconsistency between models
- Solution: Delete database files and restart to recreate schema

### "Port 5173 already in use"
- Cause: Previous vite instance still running
- Solution: Kill Node processes and restart with different port

### "bcrypt version" warning
- This is a non-critical warning from passlib about version detection
- It can be safely ignored as it doesn't affect functionality 