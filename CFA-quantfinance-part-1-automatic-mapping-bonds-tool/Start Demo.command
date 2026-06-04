#!/bin/zsh

cd "$(dirname "$0")" || exit 1

BUNDLED_NODE="/Users/felixmac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if [ -x "$BUNDLED_NODE" ]; then
  NODE_BIN="$BUNDLED_NODE"
else
  NODE_BIN="$(command -v node)"
fi

if [ -z "$NODE_BIN" ]; then
  echo "Node.js was not found."
  echo "Please run the demo from VS Code with the bundled Node command in README.md."
  read -r "?Press Enter to close this window."
  exit 1
fi

echo "Starting Sovereign Bond Screening Tool demo..."
echo "Open http://127.0.0.1:4173 in your browser."
echo "If you see EADDRINUSE, the demo is already running on port 4173."
echo "Press Control + C to stop the server."
echo

"$NODE_BIN" scripts/dev-server.mjs
