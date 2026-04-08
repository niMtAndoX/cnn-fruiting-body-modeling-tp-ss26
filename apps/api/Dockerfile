FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=prod \
    DEBUG=false \
    API_HOST=0.0.0.0 \
    API_PORT=8000 \
    API_PREFIX=/api/v1 \
    PREDICTION_BACKEND=darknet \
    MODEL_VERSION=darknet-cnn-v1 \
    INFERENCE_SCRIPT_PATH=/opt/waldpilz/scripts/inference.sh \
    MODEL_DIR=/opt/waldpilz/models/darknet \
    DARKNET_DIR=/opt/waldpilz/vendor/darknet/build-linux \
    INFERENCE_TIMEOUT_SECONDS=30

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    build-essential \
    cmake \
    git \
    libopencv-dev \
    libprotobuf-dev \
    protobuf-compiler \
    libopenblas64-openmp-dev \
    file \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/waldpilz

COPY apps/api /opt/waldpilz/apps/api
COPY scripts /opt/waldpilz/scripts
COPY models /opt/waldpilz/models

RUN git clone https://github.com/hank-ai/darknet.git /opt/waldpilz/vendor/darknet && \
    chmod +x /opt/waldpilz/scripts/inference.sh && \
    cd /opt/waldpilz/vendor/darknet && \
    cmake -S . -B build-linux -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build-linux --parallel "$(nproc)" && \
    file /opt/waldpilz/vendor/darknet/build-linux/src-cli/darknet && \
    chmod +x /opt/waldpilz/vendor/darknet/build-linux/src-cli/darknet && \
    cd /opt/waldpilz/apps/api && \
    pip install --upgrade pip && \
    pip install .

WORKDIR /opt/waldpilz/apps/api

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]