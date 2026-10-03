#!/bin/zsh
# Publishes the game to Cloudflare Pages (https://paperbull.pages.dev).
# Only the public files go up: the game, admin, helper, legal pages, icons.
set -e
cd "$(dirname "$0")"
OUT=$(mktemp -d)
cp index.html admin.html helper.html version.txt manifest.webmanifest icon-192.png icon-512.png "$OUT"/
cp -R legal "$OUT"/legal
npx --yes wrangler@4 pages deploy "$OUT" --project-name paperbull --branch main --commit-dirty=true
rm -rf "$OUT"
