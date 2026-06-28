<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'PowerPlinko/Wheel',
	});
</script>

<script lang="ts">
	import { randomInteger } from 'utils-shared/random';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet } from '../game/utils';
	import { getMode, TOTAL_BANDS } from '../game/modes';
	import type { Bet } from '../game/typesBookEvent';

	setContext();

	// Build one complete round (book) for a risk mode + landing band, then play it
	// straight through playBet (no RGS) — the Game animates it. The coefficients and
	// odds MIRROR the math (game_config.distance_bands_by_mode); the Game re-derives
	// the win from `multiplier`, so `amount` is only there for event-shape fidelity.
	const buildBook = (modeKey: string, band: number) => {
		const multiplier = getMode(modeKey).multipliers[band];
		const amount = Math.round(multiplier * 100);
		const events: Bet['state'] = [
			{
				index: 0,
				type: 'wheel',
				band,
				totalBands: TOTAL_BANDS,
				distance: Math.round((band / (TOTAL_BANDS - 1)) * 1e4) / 1e4,
				multiplier,
			},
			{ index: 1, type: 'setTotalWin', amount },
			{ index: 2, type: 'finalWin', amount },
		];
		return { id: 0, payoutMultiplier: amount, events };
	};

	const play = (book: ReturnType<typeof buildBook>) =>
		playBet({ ...book, state: book.events });

	// Weighted-random landing band reproducing the mode's true on-platform odds.
	const weightedBand = (modeKey: string) => {
		const w = getMode(modeKey).weights;
		const total = w.reduce((a, b) => a + b, 0);
		let r = randomInteger({ min: 1, max: total });
		for (let b = 0; b < w.length; b++) {
			r -= w[b];
			if (r <= 0) return b;
		}
		return 0;
	};

	// onDrop is called with the in-game selected risk mode (the RISK MODE selector
	// under Recent Plays). Each DROP plays a real-odds book for that mode.
	const playRealOdds = (modeKey: string) => play(buildBook(modeKey, weightedBand(modeKey)));
	const playTopBand = (modeKey: string) => play(buildBook(modeKey, TOTAL_BANDS - 1));
</script>

<!-- Pick the risk level in-game (RISK MODE list), set Bet + Balls, then DROP. -->
<Story name="play">
	<Game onDrop={playRealOdds} />
</Story>

<!-- Forces the farthest/top bucket of the selected mode (debug the big-win path). -->
<Story name="top band (jackpot)">
	<Game onDrop={playTopBand} />
</Story>
