#!/bin/zsh
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js is needed. Install Node.js, then open this file again.'
  read '?Press Return to close.'
  exit 1
fi
node scripts/serve.mjs
