<script lang="ts">
	// Balance readout, drawn ON THE BOARD (board space 1372×784) so it can be positioned
	// freely with static/art/align.html → "Balance". Single line. Position + font size are
	// the BALANCE constants below — paste the values from align.html here.
	import { Text } from 'pixi-svelte';
	import { stateBet } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	const BALANCE = { x: 1097, y: 18, fontSize: 23 };

	// Gold = the ForgeButton highlight/active text colour (GOLD_BRIGHT), so the balance
	// reads in the same "on-click" button tone.
	const GOLD_BRIGHT = 0xffd34d;

	const balanceStr = $derived(numberToCurrencyString(stateBet.balanceAmount));
</script>

<Text
	x={BALANCE.x}
	y={BALANCE.y}
	anchor={0.5}
	text={`BALANCE  ${balanceStr}`}
	style={{
		fontFamily: 'proxima-nova',
		fontWeight: '700',
		fontSize: BALANCE.fontSize,
		letterSpacing: 1,
		fill: GOLD_BRIGHT,
	}}
/>
