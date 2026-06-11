#!/bin/sh
# Démarrer le worker ARQ en tâche de fond
python -m arq app.worker.queue.WorkerSettings &

# Démarrer le serveur API FastAPI au premier plan
uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers