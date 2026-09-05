FROM node:22-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000 \
    CV_RUNTIME_DIR=/tmp/aeropatch-runtime

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg libglib2.0-0 libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY frontend-react/package*.json ./frontend-react/
RUN cd frontend-react && npm ci
COPY backend/API/requirements.txt ./backend/API/requirements.txt
RUN python3 -m pip install --break-system-packages -r backend/API/requirements.txt

COPY . .
RUN npm run build
RUN chmod +x scripts/start-render.sh

EXPOSE 10000
CMD ["scripts/start-render.sh"]
