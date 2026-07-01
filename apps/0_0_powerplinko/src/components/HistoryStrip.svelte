<script lang="ts">
	// Cosmetic "last 10 results" strip, drawn on the board (top-left, where the RISK MODE
	// selector used to sit — that moved into the control bar). Reads the app-local
	// stateHistory; no RGS dependency. Most-recent-first, left → right. Win/loss tinted,
	// on-theme (gold = win, muted = loss, neutral = break-even). Position via align.html.
	import { Text, Rectangle } from 'pixi-svelte';

	import { stateHistory } from '../game/stateHistory.svelte';
	import { fmtMult } from '../game/modes';

	type Props = {
		x?: number;
		y?: number;
		pillWidth?: number;
		pillHeight?: number;
		gap?: number;
		showCaption?: boolean;
	};
	const {
		x = 412,
		y = 766,
		pillWidth = 72,
		pillHeight = 31,
		gap = 6,
		showCaption = false,
	}: Props = $props();

	const skin = (mult: number) => {
		if (mult > 1) return { fill: 0x2a2410, border: 0xf5d042, text: 0xffd34d }; // win
		if (mult < 1) return { fill: 0x1a1416, border: 0x5a4246, text: 0x9a8a8e }; // loss
		return { fill: 0x1a2030, border: 0x3a4252, text: 0xc7cedb }; // break-even
	};
</script>

{#if showCaption}
	<Text
		{x}
		y={y - pillHeight / 2 - 14}
		anchor={{ x: 0, y: 0.5 }}
		text="LAST 10"
		style={{
			fontFamily: 'proxima-nova',
			fontWeight: '700',
			fontSize: 13,
			letterSpacing: 1,
			fill: 0x8a93a6,
		}}
	/>
{/if}

{#each stateHistory.items as item, i (i)}
	{@const s = skin(item.mult)}
	{@const px = x + i * (pillWidth + gap) + pillWidth / 2}
	<Rectangle
		x={px}
		{y}
		anchor={0.5}
		width={pillWidth}
		height={pillHeight}
		borderRadius={7}
		backgroundColor={s.fill}
		backgroundAlpha={0.92}
		borderColor={s.border}
		borderWidth={1.5}
	/>
	<Text
		x={px}
		{y}
		anchor={0.5}
		text={fmtMult(item.mult)}
		style={{ fontFamily: 'proxima-nova', fontWeight: '700', fontSize: 14, fill: s.text }}
	/>
{/each}
