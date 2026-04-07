#!/usr/bin/with-contenv bashio

# Read configuration from HA add-on options
export BABY_BUDDY_URL=$(bashio::config 'baby_buddy_url')
export BABY_BUDDY_API_KEY=$(bashio::config 'baby_buddy_api_key')
export REFRESH_INTERVAL=$(bashio::config 'refresh_interval')
export DEMO_MODE=$(bashio::config 'demo_mode')
export UNIT_SYSTEM=$(bashio::config 'unit_system')

bashio::log.info "Starting Baby Buddy Dashboard..."
bashio::log.info "Connecting to Baby Buddy at: ${BABY_BUDDY_URL}"

cd /app
exec python3 -m uvicorn backend.server:app \
    --host 0.0.0.0 \
    --port 8099 \
    --log-level info
