FROM python:3.12-alpine AS build

RUN apk add --no-cache nodejs npm

COPY baby-buddy-dashboard/frontend/ /tmp/frontend/
WORKDIR /tmp/frontend
RUN npm ci && npm run build

FROM python:3.12-alpine

COPY baby-buddy-dashboard/backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

COPY --from=build /tmp/frontend/dist/ /app/static/
COPY baby-buddy-dashboard/backend/ /app/backend/

WORKDIR /app
EXPOSE 8099

CMD ["python3", "-m", "uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8099", "--log-level", "info"]
