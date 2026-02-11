ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js for building frontend (build-time only)
RUN apk add --no-cache nodejs npm

# Install Python dependencies
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# Build frontend
COPY frontend/ /tmp/frontend/
WORKDIR /tmp/frontend
RUN npm ci && npm run build

# Move built assets into place
RUN mkdir -p /app/static && \
    cp -r /tmp/frontend/dist/* /app/static/ && \
    rm -rf /tmp/frontend

# Copy backend
COPY backend/ /app/backend/

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

WORKDIR /app

CMD [ "/run.sh" ]
