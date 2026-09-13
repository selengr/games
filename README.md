# Arcade Hub

A small TypeScript arcade you can actually play:

- **Snake** — canvas loop, pause, swipe / WASD, high score
- **Tic-Tac-Toe** — minimax AI (easy / medium / hard), keyboard 1–9
- **Rock Paper Scissors** — first to 3, streak + career stats
- **Memory Match** — timer, moves, best run saved locally

Shared mute, sound effects, and scores that stick in `localStorage`.

## Live demo

https://selengr.github.io/arcade-hub/

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

Push to `main`. GitHub Actions builds and publishes Pages.

Repo settings → Pages → Source → **GitHub Actions**.
