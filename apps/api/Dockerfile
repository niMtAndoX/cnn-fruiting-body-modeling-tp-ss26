# syntax=docker/dockerfile:1.7

ARG PYTHON_BASE_IMAGE=python:3.12.13-slim-bookworm

FROM ${PYTHON_BASE_IMAGE} AS api-builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    cmake \
    git \
    libopenblas-dev \
    libopenblas0-openmp \
    libopencv-dev \
    libprotobuf-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api /app/apps/api

RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip wheel --wheel-dir /tmp/wheels /app/apps/api

FROM api-builder AS darknet-builder

ARG DARKNET_REPOSITORY=https://github.com/hank-ai/darknet.git
ARG DARKNET_REF=v5.1

RUN git clone "$DARKNET_REPOSITORY" /app/vendor/darknet && \
    cd /app/vendor/darknet && \
    git checkout "$DARKNET_REF" && \
    cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --parallel "$(nproc)" && \
    chmod +x /app/vendor/darknet/build/src-cli/darknet

FROM ${PYTHON_BASE_IMAGE} AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=prod \
    DEBUG=false \
    API_HOST=0.0.0.0 \
    API_PORT=8000 \
    API_PREFIX=/api/v1 \
    LOG_LEVEL=INFO \
    CORS_ALLOW_ORIGINS= \
    MAX_UPLOAD_SIZE_MB=20 \
    ALLOWED_UPLOAD_CONTENT_TYPES=image/jpeg,image/png \
    MODEL_VERSION=darknet-cnn-v1 \
    INFERENCE_SCRIPT_PATH=/app/scripts/inference.sh \
    MODEL_DIR=/app/models/darknet \
    DARKNET_BIN=/app/vendor/darknet/build/src-cli/darknet \
    INFERENCE_TIMEOUT_SECONDS=30

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    libopenblas0-openmp \
    libopencv-dev \
    libprotobuf-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=api-builder /tmp/wheels /tmp/wheels

RUN python -m pip install --upgrade pip && \
    python -m pip install --no-cache-dir --no-index --find-links /tmp/wheels waldpilz-api && \
    rm -rf /tmp/wheels

COPY scripts /app/scripts
COPY models /app/models
COPY --from=darknet-builder /app/vendor/darknet/build /app/vendor/darknet/build

RUN chmod +x /app/scripts/inference.sh /app/vendor/darknet/build/src-cli/darknet

WORKDIR /app

EXPOSE 8000

CMD ["python", "-m", "app.run"]
