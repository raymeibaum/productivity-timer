# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Commands

**Dev (watch + live reload):**
```
npm run dev
```
Runs Tailwind in watch mode and `live-server` in parallel. Opens the browser automatically and reloads on changes to `index.html`, `js/`, or compiled CSS.

**Build CSS (one-shot):**
```
./node_modules/.bin/tailwindcss -i ./css/input.css -o ./css/style.css
```
Note: Tailwind v4 CLI is `@tailwindcss/cli` (separate from the `tailwindcss` package). `npm run dev` resolves it automatically via `node_modules/.bin`.

## Architecture

A pomodoro-inspired productivity timer deployed as a GitHub Pages static site. No build step beyond CSS compilation.

- **`css/input.css`** — Tailwind v4 source (`@import "tailwindcss"` only); edit this, not `style.css`
- **`css/style.css`** — compiled output; committed to the repo so GitHub Pages can serve it without a CI build step
- **`js/main.js`** — vanilla JS app logic
- **`index.html`** — single page; Alpine.js loaded via CDN (`x-data` on `<main>` holds top-level state)

Alpine.js handles reactive UI state (e.g., `state: 'rest'`). App logic lives in `js/main.js`. There is no bundler or module system — all JS is plain globals.
