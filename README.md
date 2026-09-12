# Arcade Hub

A small TypeScript arcade portfolio with three original browser games:

- **Tic-Tac-Toe** — play vs minimax AI (easy / medium / hard) with saved scores
- **Rock Paper Scissors** — streak + local stats
- **Memory Match** — flip pairs and beat your best move count

Built with **Vite + TypeScript**. No frameworks, no tutorial clones.

## Live demo

After GitHub Pages is enabled: **https://selengr.github.io/games/**

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to `main`. The GitHub Actions workflow builds and publishes to GitHub Pages.

In the repo settings, set **Pages → Source** to **GitHub Actions** if it is not already.

## Why this project

Rewrote an old beginner games dump into a clean, deployable portfolio piece that shows:

- TypeScript game logic (including minimax)
- Client-side routing + state
- localStorage persistence
- Responsive UI
