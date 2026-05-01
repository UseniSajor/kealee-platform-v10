# ── AI Learning Service — Python FastAPI ───────────────────────────────────────
# Continuous AI learning service for permit prediction models.
# Heavy ML deps (PyTorch, MLflow) are installed here.

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (split into layers for caching)
COPY services/ai-learning/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy service source
COPY services/ai-learning/ ./

ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# FastAPI entry point — adjust if main app module differs
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3000"]
