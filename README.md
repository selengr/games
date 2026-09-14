# Arcade Hub

A small TypeScript arcade you can actually play:

- **Snake** — canvas loop, speed modes, wrap walls, pause, swipe / WASD, high score
- **Tic-Tac-Toe** — minimax AI or vs friend, keyboard 1–9
- **Rock Paper Scissors** — first to 3, streak + career stats
- **Memory Match** — small / normal / large boards, timer, best run

Shared mute, volume slider, sound effects, hub stats, badges, how-to-play help, and scores in `localStorage`.

## Live demo

https://selengr.github.io/arcade-hub/

## Run locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to `main`. GitHub Actions builds and publishes Pages.

Repo settings → Pages → Source → **GitHub Actions**.
