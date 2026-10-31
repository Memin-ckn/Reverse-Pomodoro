#!/bin/sh
# Reverse Pomodoro - Linux launcher
DIR="$(cd "$(dirname "$0")" && pwd)"
FILE="$DIR/app/index.html"
for cmd in xdg-open gio sensible-browser x-www-browser firefox google-chrome chromium chromium-browser; do
  if command -v "$cmd" >/dev/null 2>&1; then
    if [ "$cmd" = gio ]; then gio open "$FILE"; else "$cmd" "$FILE"; fi
    exit 0
  fi
done
echo "No browser found. Please open this file manually in a browser: $FILE"
exit 1
