FROM python:3.12-slim-bookworm AS base

# Security hardening: create non-root user
RUN groupadd -g 10001 paw && \
    useradd -u 10001 -g paw -m -s /bin/bash paw

WORKDIR /app

# Install system dependencies for document handling and crypto
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libmagic1 \
    libfreetype6 \
    libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY apps/api /app/apps/api
COPY packages /app/packages

RUN mkdir -p /data/library /data/sqlite /data/artifacts && \
    chown -R paw:paw /app /data

USER paw:paw
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/healthz || exit 1

CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
