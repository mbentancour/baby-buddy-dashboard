#!/usr/bin/with-contenv bashio

# Read configuration from HA add-on options
export BABY_BUDDY_URL=$(bashio::config 'baby_buddy_url')
export BABY_BUDDY_API_KEY=$(bashio::config 'baby_buddy_api_key')
export REFRESH_INTERVAL=$(bashio::config 'refresh_interval')
export DEMO_MODE=$(bashio::config 'demo_mode')
export UNIT_SYSTEM=$(bashio::config 'unit_system')
export ENABLE_MEDICATION_ALERTS=$(bashio::config 'enable_medication_alerts')
export CHILD_SEX=$(bashio::config 'child_sex' '')
export COLOR_PRESET=$(bashio::config 'color_preset' '')
export THEME_LIGHT_BG=$(bashio::config 'theme_light_bg' '')
export THEME_LIGHT_CARD_BG=$(bashio::config 'theme_light_card_bg' '')
export THEME_LIGHT_BORDER=$(bashio::config 'theme_light_border' '')
export THEME_LIGHT_TEXT=$(bashio::config 'theme_light_text' '')
export THEME_LIGHT_TEXT_MUTED=$(bashio::config 'theme_light_text_muted' '')
export THEME_LIGHT_TEXT_DIM=$(bashio::config 'theme_light_text_dim' '')
export THEME_LIGHT_ACCENT=$(bashio::config 'theme_light_accent' '')
export THEME_DARK_BG=$(bashio::config 'theme_dark_bg' '')
export THEME_DARK_CARD_BG=$(bashio::config 'theme_dark_card_bg' '')
export THEME_DARK_BORDER=$(bashio::config 'theme_dark_border' '')
export THEME_DARK_TEXT=$(bashio::config 'theme_dark_text' '')
export THEME_DARK_TEXT_MUTED=$(bashio::config 'theme_dark_text_muted' '')
export THEME_DARK_TEXT_DIM=$(bashio::config 'theme_dark_text_dim' '')
export THEME_DARK_ACCENT=$(bashio::config 'theme_dark_accent' '')

bashio::log.info "Starting Baby Buddy Dashboard..."
bashio::log.info "Connecting to Baby Buddy at: ${BABY_BUDDY_URL}"

cd /app
exec python3 -m uvicorn backend.server:app \
    --host 0.0.0.0 \
    --port 8099 \
    --log-level info \
    --no-server-header
