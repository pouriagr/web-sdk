// Pixi asset manifest for Ember Rotor. Each key resolves a texture in
// stateApp.loadedAssets; <Sprite key="bg" /> etc. reads it.
//
// SUB-PATH SAFETY (2026-07-01 fix): the texture files live in `static/art/` and are
// served at `<base>/art/*.png`. We MUST reference them as `../../art/<name>.png` — NOT
// `../../static/art/...`. Reason: `../../static/art/bg.png` resolves to a REAL file at
// build time, so Vite rewrites it to an ABSOLUTE `/art/bg.png`, which 404s when Stake
// serves the game from a CDN sub-path. `../../art/bg.png` does NOT resolve to a build-time
// file (app-root `art/` has no `bg.png`), so Vite leaves it as a runtime
// `new URL(..., import.meta.url)` that resolves RELATIVE TO THE BUNDLE → correct under any
// sub-path. This mirrors how `apps/lines` references `../../assets/...`. Do not "simplify"
// back to a static/-prefixed or absolute path.
//
// All board sprites are `preload: true` so AssetsLoader has them ready before the
// board renders (no missing-texture flash / console errors).
export default {
	bg: {
		type: 'sprite',
		src: new URL('../../art/bg.png', import.meta.url).href,
		preload: true,
	},
	rotor: {
		type: 'sprite',
		src: new URL('../../art/rotor.png', import.meta.url).href,
		preload: true,
	},
	buckets: {
		type: 'sprite',
		src: new URL('../../art/buckets.png', import.meta.url).href,
		preload: true,
	},
	orb: {
		type: 'sprite',
		src: new URL('../../art/orb.png', import.meta.url).href,
		preload: true,
	},
	panel: {
		type: 'sprite',
		src: new URL('../../art/panel.png', import.meta.url).href,
		preload: true,
	},
	// NOTE: the win chime is NOT loaded here. It's the served file static/sfx/win.mp3, played by
	// Sound.svelte via a plain HTMLAudioElement (served, NOT a base64 data: URI — Stake's game
	// iframe CSP blocks `data:` media, which silenced it). See Sound.svelte.
} as const;
