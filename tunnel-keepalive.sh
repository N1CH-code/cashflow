#!/bin/bash
# Keep cloudflared tunnel alive and restart if needed
while true; do
  if ! pgrep -f "cloudflared tunnel" > /dev/null; then
    echo "[$(date)] cloudflared not running, starting..."
    nohup cloudflared tunnel run marketplace > /tmp/cloudflared.log 2>&1 &
    sleep 10
  fi
  # Ping the tunnel to keep NAT alive
  curl -sf --connect-timeout 10 --max-time 15 https://cashflow.359market.ru/ > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "[$(date)] Tunnel unhealthy, restarting..."
    pkill -f "cloudflared tunnel" 2>/dev/null
    sleep 3
    nohup cloudflared tunnel run marketplace > /tmp/cloudflared.log 2>&1 &
    sleep 15
  fi
  sleep 30
done