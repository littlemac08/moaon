#!/bin/zsh
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo 'Node.js 20 이상을 먼저 설치해주세요.'
  read '?Enter를 누르면 종료합니다.'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci || exit 1
fi
npm run dev
