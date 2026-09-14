# Arcade Hub

A small TypeScript arcade you can actually play:

- **Snake** — canvas loop, pause, swipe / WASD, high score
- **Breakout** — paddle bounce, drag or arrow keys, clear the wall
- **Balloon Pop** — tap to pop, streak bonuses, forgiving mobile hits
- **Tic-Tac-Toe** — minimax AI or vs friend
- **Rock Paper Scissors** — first to 3
- **Memory Match** — flip pairs, best run

Shared mute, daily challenge, continue last game, offline cache, and scores in `localStorage`.

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
