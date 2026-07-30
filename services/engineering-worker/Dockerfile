FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-dev python3-pip python3-venv \
     tesseract-ocr tesseract-ocr-eng libgdal-dev gdal-bin proj-bin libproj-dev \
     libgl1 libglib2.0-0 build-essential \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY services/engineering-worker/python/requirements.txt /tmp/engineering-requirements.txt
RUN python3 -m venv /opt/engineering-venv \
  && /opt/engineering-venv/bin/pip install --no-cache-dir --upgrade pip \
  && /opt/engineering-venv/bin/pip install --no-cache-dir -r /tmp/engineering-requirements.txt

COPY . .
RUN corepack enable && pnpm install --frozen-lockfile \
  && pnpm --filter @kealee/engineering-worker... build

ENV ENGINEERING_PYTHON=/opt/engineering-venv/bin/python
ENV ENGINEERING_PROCESSOR=/app/services/engineering-worker/python/processor.py
CMD ["node", "services/engineering-worker/dist/index.js"]
