# AniRec design system (project)

This file summarizes the visual system implemented for the card-shop redesign. The ui-ux-pro-max CLI (`search.py --design-system`) was not run here because Python was not available in the build environment; align future changes with these notes and the skill checklist in `.cursor/skills/ui-ux-pro-max/SKILL.md`.

## Product metaphor

- **Booster shop**: One active pack at a time (master = all sources, or a single streaming SKU).
- **Rip / reveal**: Pack opening stays gesture-first (swipe up + tap); reduced motion uses a shorter path.

## Typography

- **UI body**: Overpass (`--font-primary`).
- **Display / landing headline**: Lexend (`--font-display`).
- **Accent script**: Dancing Script (`--font-accent`) on landing key word only.

## Color

- Existing AniList-inspired tokens in `src/index.css` (`--anilist-blue`, purple, pink, etc.) drive gradients and accents.
- Light and dark themes both supported; glass panels use higher-opacity surfaces in light mode where needed.

## Motion

- Framer Motion for landing fan and sheets; `prefers-reduced-motion` honored on landing hero.
- Pack roulette scales particle/confetti counts down on narrow viewports.

## Icons

- SVG only for UI chrome (no emoji icons). Streaming marks use inline SVG in `StreamingIcons.tsx`.

## Mobile

- Breakpoint ~`900px`: sidebar `PackShop` hidden; **BoosterSheet** + **mobile booster bar** for pack switching.
- Safe areas: `env(safe-area-inset-*)` on header, sheet, and full-screen modal.
- Details modal becomes full-viewport sheet under `640px`.

## Pack assets

- Central manifest: `src/data/packAssets.ts` (paths under `/public`). Platform-specific front/edge/back filenames must match your shipped PNGs.
