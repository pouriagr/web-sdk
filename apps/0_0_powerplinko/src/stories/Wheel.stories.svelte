<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'EmberRotor/Game',
	});
</script>

<script lang="ts">
	import {
		StoryGameTemplate,
		StoryLocale,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';
	import { randomInteger } from 'utils-shared/random';
	import { stateBet, stateConfig } from 'state-shared';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet } from '../game/utils';
	import { getMode, TOTAL_BANDS } from '../game/modes';
	import type { Bet } from '../game/typesBookEvent';

	setContext();

	// Storybook has no RGS, so seed bet levels + a starting bet so the control bar's
	// −/BET/+ stepper and RISK selector are interactive in the preview. (Real bet levels
	// come from the RGS config via Authenticate on the live platform.)
	stateConfig.betAmountOptions = [0.2, 0.4, 1, 2, 5, 10, 20, 50, 100, 200];
	stateBet.betAmount = 1;

	// NOTE: in Storybook the DROP button is intentionally inert/greyed — it needs a live
	// RGS to fetch an outcome. To preview a round here, pick the risk level in the control
	// bar, then click the green "Action" button (top-left) to play a mock book through
	// playBet. The coefficients/odds MIRROR the math (game_config.distance_bands_by_mode).
	const buildBook = (modeKey: string, band: number) => {
		const multiplier = getMode(modeKey).multipliers[band];
		const amount = Math.round(multiplier * 100);
		const events: Bet['state'] = [
			{
				index: 0,
				type: 'wheel',
				mode: modeKey,
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

	const play = (book: ReturnType<typeof buildBook>) => playBet({ ...book, state: book.events });

	// Weighted-random landing band reproducing the active mode's true on-platform odds.
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

	const playRealOdds = () =>
		play(buildBook(stateBet.activeBetModeKey, weightedBand(stateBet.activeBetModeKey)));
	const playTopBand = () => play(buildBook(stateBet.activeBetModeKey, TOTAL_BANDS - 1));
</script>

{#snippet template(args: TemplateArgs<any>)}
	<StoryGameTemplate
		skipLoadingScreen={args.skipLoadingScreen}
		action={async () => {
			await args.action?.(args.data);
		}}
	>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
{/snippet}

<!-- Real on-platform odds for the selected risk mode. -->
<Story
	name="real odds (stake)"
	args={templateArgs({ skipLoadingScreen: true, data: {}, action: playRealOdds })}
	{template}
/>

<!-- Forces the farthest/top bucket of the selected mode (debug the big-win path). -->
<Story
	name="top band (jackpot)"
	args={templateArgs({ skipLoadingScreen: true, data: {}, action: playTopBand })}
	{template}
/>
