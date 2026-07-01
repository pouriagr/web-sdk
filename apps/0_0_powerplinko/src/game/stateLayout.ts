import { createLayout } from 'utils-layout';

// The board is drawn in the chassis art's native pixel space (bg.png is 1372x784),
// so the Pixi board can reuse the exact geometry constants the old SVG used
// (see components/Board.svelte: VW/VH/START_X/bandX/…). MainContainer scales this
// box to fit each device; the standard <UI> bar positions off canvasSizes, not this.
// Phase 6 will tune the per-orientation sizes for proper mobile/portrait framing.
const BOARD = { width: 1372, height: 784 };
// Wide layouts reserve a bottom band so the framework bet bar sits BELOW the board's
// buckets instead of on top of them. The bg renders at the top of this taller box
// (occupying ~top 78%); the empty bottom ~22% is where the bet bar / UI panel goes.
// (Board is slightly pillarboxed as a result.) Portrait/tablet tuned in Phase 6.
const WIDE = { width: 1372, height: 1006 };

export const { stateLayout, stateLayoutDerived } = createLayout({
	backgroundRatio: {
		normal: 2039 / 1000,
		portrait: 1242 / 2208,
	},
	mainSizesMap: {
		desktop: { ...WIDE },
		tablet: { ...BOARD },
		landscape: { ...WIDE },
		portrait: { ...BOARD },
	},
});
