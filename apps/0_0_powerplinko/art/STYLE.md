# Ember Rotor — Art Style Spec

Single source of visual consistency for `0_0_powerplinko` (display title **Ember Rotor**).
Every asset prompt folds in this spec. Keep current as the look evolves.

## Concept
An arcane **forge machine**: a heavy dark-iron chassis houses a glowing, rune-engraved
**rotor disc** on the left. A molten **ember/fireball** drops from a chute at the top,
is flung off the spinning rotor, and arcs across a track into one of nine glowing
**landing buckets** along the bottom. Mood = molten, arcane-industrial, premium casino
sheen. Think enchanted foundry, not cartoon pinball.

## Perspective & composition
- **Flat side-view** (near-orthographic), 16:9-ish board.
- Rotor disc: left third, vertically centered. Drop chute: top-center. Track + buckets:
  span the lower-right, resting along the bottom.
- The bottom-center strip is reserved for the framework UI bar — keep it visually calm
  (no busy detail, no baked controls) so the overlaid bet bar reads cleanly.

## Palette (hex)
- Chassis / background: `#0a0d12` (near-black blue-charcoal) → `#141a24` (iron panel).
- Iron edges / steel: `#2a313d`, `#3a4252`.
- Ember core (hot→cool): `#ff3b1f` (red-hot core) → `#ff7a1a` (orange) → `#ffb02e` (amber).
- Rune / gold glow: `#f5d042` (gold), `#ffd34d` (bright gold), `#ffe9a8` (pale highlight).
- Neutral text/steel: `#c7cedb`, muted `#6b7486`.

## Style keywords
Molten metal, glowing runes, soft bloom on hot elements, metallic specular highlights,
volumetric ember sparks, etched arcane sigils, premium slot-game polish, high contrast,
deep shadows, subtle rim-light. Semi-realistic stylized (not flat vector, not photoreal).

## Technical
- Base board resolution **1372 × 784** (board art at native or 2× = 2744 × 1568 for crispness).
- Loose elements (rotor, orb, buckets, title) on **transparent** background, centered, square
  where noted, with the glow contained inside the canvas (no glow clipped at edges).
- **No text, numbers, watermarks, or logos** baked into gameplay art (the frontend overlays
  multipliers, balance, bet, etc.). The only asset that contains the wordmark is `title.png`.
- Original art only — no copyrighted/branded characters, mascots, or named-artist styles.

## Asset paths (this game's convention)
Files live in `static/art/` and are loaded as Pixi sprites via
`new URL('../../static/art/<name>.png', import.meta.url)` (see `src/game/assets.ts`).
Board geometry (coordinate space 1372×784) is in `src/components/Board.svelte`.
