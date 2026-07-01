# Ember Rotor — Asset list & image prompts (Phase 5)

Generate each asset in your image tool from the matching prompt below, export, and save to the
**target path**. All prompts assume the look in `STYLE.md`. After the files are in place, tell me
and I'll wire them in and verify in Storybook.

> Board geometry is in `src/components/Board.svelte` (1372×784 space). If a regenerated element
> doesn't line up perfectly, the alignment constants there (START_X/LAUNCH_X/BK_X0/WHEEL/…) are
> tunable — I'll nudge them when wiring in.

## Asset list

| # | asset | target path | size (px) | transparent? | priority | notes |
|---|-------|-------------|-----------|--------------|----------|-------|
| 1 | board background | `static/art/bg.png` | 1372×784 (or 2× 2744×1568) | no (opaque) | **MUST** | NO baked control panels; rotor socket left, drop chute top-center, bucket trough bottom; calm bottom-center strip for the UI bar |
| 2 | title wordmark | `static/art/title.png` | 1040×140 | yes | **MUST** | reads "EMBER ROTOR"; replaces the old "POWER PLINKO" |
| 3 | landing buckets | `static/art/buckets.png` | 1280×270 | yes | recommended | 9 buckets, **label-free** (FE overlays the ×multipliers) |
| 4 | rune rotor disc | `static/art/rotor.png` | 720×720 | yes | optional refresh | square, spins in place; glowing runes around the rim |
| 5 | ember/fireball | `static/art/orb.png` | 512×512 | yes | optional refresh | square, glowing molten ball, glow inside canvas |
| 6a | tile background | `art/EmberRotor-BG.png` (or `.jpg`) | **PORTRAIT** ~1200×1600 (3:4) | no (opaque) | **MUST** | store-tile BG: vibrant forge world, vertical framing, NO focal subject (FG layers over it) |
| 6b | tile foreground | `art/EmberRotor-FG.png` | **PORTRAIT** ~1200×1600, transparent | **yes** | **MUST** | hero key-item (rotor + fireball), composed for a vertical tile; **BG + FG ≤ 3 MB combined** |
| 6c | provider logo | `art/GTC-Logo.png` | transparent, legible at small sizes | **yes** | **MUST** | GTC studio brand; reuse your existing logo if you have one |

---

## Prompts

### 1 — Board background (`static/art/bg.png`, 1372×784, opaque)
> Side-view background art for an arcane forge slot-game board, 1372×784 landscape. A heavy
> dark-iron machine chassis in near-black blue-charcoal (#0a0d12) shading to iron panel (#141a24),
> with brushed-steel edges (#2a313d, #3a4252) and faint glowing gold rune etchings (#f5d042). On
> the LEFT THIRD, vertically centered, a large empty CIRCULAR SOCKET / recessed housing (about 24%
> of the width across) where a rotor disc will be mounted — leave the socket interior dark and
> empty. At TOP-CENTER, a small forge chute/spout (around 46% from the left) hinting where an ember
> drops from. Along the BOTTOM, spanning roughly 25%–77% of the width and the lower ~20% of height,
> a horizontal trough / bucket housing with a dark back wall and warm ember underglow — leave the
> nine cells empty (no dividers labels or numbers). Keep the very bottom-center strip calm and
> uncluttered. Molten ember ambient glow, volumetric sparks, deep shadows, premium polish, high
> contrast. Game background art, no characters, no text, no numbers, no UI, no buttons, no
> watermark. Empty stage ready for overlaid elements.

### 2 — Title wordmark (`static/art/title.png`, 1040×140, transparent)
> Logo wordmark reading "EMBER ROTOR" in two bold words, transparent background, 1040×140. Heavy
> molten-metal letterforms forged from dark iron with glowing ember edges (#ff7a1a → #ffb02e),
> cracked-lava inner glow (#ff3b1f), gold rune highlights (#ffd34d) and pale specular (#ffe9a8).
> Arcane-industrial fantasy game logo, centered, crisp, contained within the canvas with no glow
> clipped at the edges. Just the wordmark "EMBER ROTOR" — no tagline, no mascot, no background, no
> watermark.

### 3 — Landing buckets (`static/art/buckets.png`, 1280×270, transparent)
> A horizontal row of NINE identical landing buckets / forge crucibles, transparent background,
> 1280×270. Dark-iron cups with glowing molten-amber rims (#ffb02e) and warm interior ember glow
> (#ff7a1a), thin steel dividers between them, subtle gold rune etching (#f5d042) on the metal.
> Evenly spaced edge to edge, viewed from the side, resting on an implied track. Game asset, no
> text, NO numbers or multipliers on the buckets, no background, no watermark, glow contained
> inside the canvas.

### 4 — Rune rotor disc (`static/art/rotor.png`, 720×720, transparent)
> A circular rune-engraved rotor disc / forge flywheel, transparent background, square 720×720,
> centered. Dark-iron wheel with radial spokes or paddles, a ring of glowing gold arcane runes
> (#f5d042, #ffd34d) around the rim, molten ember highlights (#ff7a1a) in the gaps, brushed-steel
> hub at the exact center, metallic specular highlights. Designed to spin in place around its
> center. Game asset, no text, no numbers, no background, no watermark, glow contained inside the
> canvas.

### 5 — Ember / fireball (`static/art/orb.png`, 512×512, transparent)
> A glowing molten ember / fireball, transparent background, square 512×512, centered. White-hot
> core (#ffe9a8) fading through gold (#ffd34d) and orange (#ff7a1a) to a deep red-hot edge
> (#ff3b1f), with a soft outer bloom and a few flying sparks. Spherical, dense, radiant. Game
> projectile asset, no text, no background, no watermark, the entire glow contained inside the
> canvas with transparent margins.

### 6 — Store tile (ACP submission) — THREE layered assets
Per Stake's spec (https://stake-engine.com/docs/approval-guidelines/game-tile-requirements) the
store tile is COMPOSED by Stake from a **Background + Foreground + Provider logo** you submit —
NOT one flat thumbnail. No fixed pixel size or aspect ratio is published (only "high resolution"),
and the **Background + Foreground combined must be ≤ 3 MB**. FG and logo must be transparent PNG;
BG may be PNG or JPG (use JPG if you need to stay under 3 MB). These are ACP-only — they live in
the app-root `art/` folder and are NOT shipped in the game `build/`. (Supersedes the old single
`thumbnail.png`, which is the wrong format and should not be uploaded.)

#### 6a — Tile background (`art/EmberRotor-BG.png` or `.jpg`, PORTRAIT ~1200×1600 (3:4), opaque)
> Vibrant environmental key-art background for the slot game "Ember Rotor", **VERTICAL / PORTRAIT
> orientation (3:4, taller than wide)**: the interior of a vast arcane forge-foundry, near-black
> blue-charcoal iron architecture (#0a0d12 → #141a24) with brushed-steel edges (#2a313d, #3a4252)
> and glowing gold rune etchings (#f5d042, #ffd34d). A huge rune-engraved rotor wheel and stacked
> rows of molten crucibles glow in the depth of the scene, lit by warm ember light — deep
> ember-orange to gold atmosphere (#ff3b1f → #ff7a1a → #ffb02e), volumetric sparks, soft bloom,
> dramatic vertical depth, premium casino sheen. Bright and eye-catching (a store tile, NOT the
> muted in-game board). Composition fills a tall portrait frame; keep the UPPER-CENTER calmer /
> less busy so a foreground subject can be composited on top. Semi-realistic stylized. NO focal
> character, NO text, NO numbers, NO multipliers, NO logo, NO UI, no watermark. Original art.

#### 6b — Tile foreground (`art/EmberRotor-FG.png`, PORTRAIT ~1200×1600, transparent)
> A dramatic hero key-item on a fully transparent background, composed for a **VERTICAL / PORTRAIT
> tile (3:4)** with the subject centered in the upper-middle: a glowing rune-engraved dark-iron
> rotor disc flinging a brilliant white-hot molten fireball upward, trailing volumetric ember
> sparks. White-hot core (#ffe9a8) through gold (#ffd34d) and orange (#ff7a1a) to red-hot edges
> (#ff3b1f), molten metal with gold rune glow (#f5d042) and metallic specular highlights, soft
> outer bloom. Semi-realistic stylized, high contrast, premium slot key-art. The entire subject and
> its glow CONTAINED inside the canvas with transparent margins. NO background, NO text, NO numbers,
> NO multipliers, NO logo, no watermark. Original art.

#### 6c — Provider logo (`art/GTC-Logo.png`, transparent, legible small)
> Studio brand = **GTC**. If GTC already has a logo, just use it (transparent PNG) and skip this.
> Otherwise generate one with: A clean, legible studio logo emblem + wordmark reading "GTC",
> transparent background, centered. A forged dark-iron emblem with a single glowing gold rune /
> ember spark accent (#f5d042, #ff7a1a), bold simple metallic letterforms (#c7cedb / #ffe9a8).
> Must stay crisp and readable at small sizes (favicon-scale). Just the emblem + the letters "GTC"
> — no tagline, no mascot, no background, no watermark. Original art.

---

## Round 2 — UI tray panel (for the bet bar) + buttons

### 7 — Bottom UI tray panel (`static/art/panel.png`, ~2560×460, transparent) — **MUST for the new layout**
The board sits in the upper ~78% of the screen; the framework bet bar sits in the bottom band. This
is just the **background tray the bar rests on** (the standard buttons sit on top of it — Option A).
It is **stretched to the full canvas width** × the bottom ~24% height, so it must look fine stretched:
keep the design HORIZONTALLY UNIFORM (no asymmetric end-caps or off-center motifs that would distort).
> A wide horizontal UI tray/bar for the bottom of a forge-themed slot game, transparent background,
> ~2560×460 landscape, designed to stretch seamlessly across the full screen width. A heavy
> horizontally-uniform dark-iron bar (#0a0d12 → #141a24) with a riveted brushed-steel surface
> (#2a313d), a continuous glowing gold rune trim running the full length of the TOP edge (#f5d042)
> like a molten lip, and a faint even ember underglow (#ff7a1a) along the bottom. The bar fills the
> lower ~88% of the canvas; the area above the top trim is transparent. Keep the centre band calm and
> even (player controls sit on top of it). NO end-caps, NO corner emblems, NO text, NO numbers, NO
> buttons, NO icons, no watermark. Repeating/stretchable horizontal texture.

### 8 — (Optional) Side rails (`static/art/rail_left.png` / `rail_right.png`, ~360×900, transparent)
Only if you want to fill the slim dark margins beside the (slightly pillarboxed) board with matching
forge framing. Skip if you prefer plain dark margins.
> A tall vertical forge-metal side rail / pillar for framing a game board, transparent background,
> ~360×900. Dark riveted iron with gold rune etching and faint ember glow down its length, ornate
> top and bottom caps. Mirror-able. Game frame art, no text, no numbers, no watermark.

### Buttons ("not cool") — needs a decision, not just art
The SDK renders every button (BET, MENU, AUTO SPIN, TURBO, +/−, etc.) as a plain rounded rectangle:
its skin component (`UiSprite`) is an **unfinished stub** ("ADD YOUR DESIGN") and the intended
button-art hook (`sharedAssetsPixi`) was never built. So giving the buttons custom art/icons means
**forking the bet-bar chrome** (UiSprite + the button components) — a real change away from the
"use the standard shell" decision (and Stake generally wants the standard controls). Options:
- **(A)** Keep the standard buttons but sit them on the new tray panel (clean, compliance-safe, no fork). ← recommended
- **(B)** Fork the bet-bar chrome for fully custom button art — then we'd generate: a button
  background sprite + glyphs for bet / menu / autospin / turbo / sound / info / paytable / settings / + / −.
Tell me A or B; if B, I'll spec the exact button sprites here.
