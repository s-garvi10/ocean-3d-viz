#!/bin/bash
# run.sh - Start the OCEAN-X backend server
# Usage: bash run.sh [--reload]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Auto-generate dataset if missing
if [ ! -f "data/sample_ocean_data.nc" ]; then
    echo "[run.sh] Generating synthetic dataset..."
    python scripts/generate_synthetic_data.py
fi

# Start the backend
echo "[run.sh] Starting OCEAN-X backend on http://0.0.0.0:8000"
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
