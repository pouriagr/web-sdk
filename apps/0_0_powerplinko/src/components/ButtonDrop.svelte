<script lang="ts">
	// Primary action button. Reuses the SDK ButtonBetProvider for ALL bet/stop/guard
	// logic (deep import — these workspace packages have no `exports` restriction, same
	// pattern as the app-local Modals.svelte), and renders our themed primary ForgeButton.
	// Mirrors components-ui-pixi/src/components/ButtonBet.svelte, but the label reads DROP
	// (in BOTH real-money and social modes — a ball-drop game) instead of BET/SPIN.
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';
	import ButtonBetProvider from 'components-ui-pixi/src/components/ButtonBetProvider.svelte';
	import { i18nDerived } from 'components-ui-pixi/src/i18n/i18nDerived';

	import ForgeButton from './ForgeButton.svelte';

	type Props = {
		width?: number;
		height?: number;
		x?: number;
		y?: number;
	};
	const { width = 300, height = 132, x = 0, y = 0 }: Props = $props();

	// Same gate the SDK ButtonBet uses for the bet path + the Space hotkey.
	const betDisabled = $derived(!stateBetDerived.isBetCostAvailable());
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		{@const isStop = key === 'stop_default' || key === 'stop_disabled'}
		<OnHotkey hotkey="Space" disabled={betDisabled} {onpress} />
		<ForgeButton
			{x}
			{y}
			{width}
			{height}
			primary
			tone="fire"
			label={isStop ? i18nDerived.stop() : 'DROP'}
			disabled={betDisabled || key === 'stop_disabled'}
			{onpress}
		/>
	{/snippet}
</ButtonBetProvider>
