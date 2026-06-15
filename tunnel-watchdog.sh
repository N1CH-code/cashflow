#!/bin/bash
exec > /tmp/tunnel-watchdog.log 2>&1
echo "[$(date)] Watchdog started"

restart_tunnel() {
  pkill -9 -f "cloudflared tunnel" 2>/dev/null
  sleep 3
  nohup cloudflared tunnel run marketplace > /tmp/cloudflared.log 2>&1 &
  echo "[$(date)] Restarted, PID $!"
  sleep 8
}

restart_tunnel

while true; do
  if ! pgrep -f "cloudflared tunnel" > /dev/null; then
    echo "[$(date)] cloudflared died, restarting..."
    restart_tunnel
  else
    # Check if any connection is alive (metric should be >0)
    last_log=$(tail -1 /tmp/cloudflared.log 2>/dev/null)
    # If last log is older than 90s, connections are dead
    ago=$(find /tmp/cloudflared.log -mtime +1s -newer /tmp/cloudflared.log 2>/dev/null; echo)
  fi
  sleep 10
done
