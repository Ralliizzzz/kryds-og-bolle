# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file Danish tic-tac-toe game ("Kryds & Bolle"). Everything — HTML structure, CSS styling, and game logic — lives in `kryds_og_bolle.html`. There is no build step, no package manager, and no dependencies.

To run the game, open `kryds_og_bolle.html` directly in a browser.

## Architecture

The entire app is one self-contained HTML file with three sections:

- **CSS (`<style>`)** — Dark-themed UI using CSS Grid for the 3×3 board. Key classes: `.cell`, `.cell.x/.o` (player colors), `.cell.win` (winning highlight animation), `.score-box`.
- **HTML (`<body>`)** — Static board of 9 `.cell` divs with `data-i="0"–"8"` indices, a scoreboard, and a reset button.
- **JavaScript (`<script>`)** — Vanilla JS, no framework. Core state: `board` (9-element array), `current` (active player), `gameOver`, `scores`. Key functions: `init()` resets the round while preserving scores, `checkWinner()` tests all 8 win combos in `WINS`, `updateScores()` syncs the DOM scoreboard.

The UI language is Danish (status messages, button labels).

## Git Workflow

After every significant change: stage the relevant files, commit with a conventional message (`feat:`, `fix:`, `chore:`, etc.), and push to origin.

```bash
git add kryds_og_bolle.html
git commit -m "feat: ..."
git push
```
