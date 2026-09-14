# Arcade Hub

A small TypeScript arcade you can actually play:

- **Snake** — canvas loop, pause, swipe / WASD, high score
- **Flappy Lite** — tap to flap, easy / normal / hard
- **Breakout** — paddle bounce, drag or arrow keys, clear the wall
- **Balloon Pop** — tap to pop, streak bonuses, forgiving mobile hits
- **Whack-a-Mole** — 30-second rounds, rising speed, streak hits
- **Reaction Duel** — wait for GO, beat the rival, first to 5
- **Tic-Tac-Toe** — minimax AI or vs friend
- **Memory Match** — flip pairs, best run

Shared mute, daily challenge, badge strip, best scores row, recent plays, soft PWA install tip, continue last game, offline cache, and scores in `localStorage`.

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
