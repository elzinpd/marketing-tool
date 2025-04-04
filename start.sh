#!/bin/bash
# Start Gunicorn processes
echo Starting Gunicorn.
exec gunicorn app.main:app \
    --config gunicorn_conf.py \
    --bind 0.0.0.0:8000 \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 3 