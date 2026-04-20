#!/bin/sh
# Explicit startup script - bypass all shell initialization
set +e
exec node /app/apps/web-main/node_modules/.next/standalone/server.js
