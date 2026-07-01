<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';
	// Reuse the SDK replay bar unchanged for replay mode (deep import — same pattern as
	// the app-local Modals.svelte). Only the `default` mode gets our custom themed bar.
	import UIReplay from 'components-ui-pixi/src/components/UIReplay.svelte';

	import ControlBar from './ControlBar.svelte';

	// App-local replacement for the SDK <UI> (components-ui-pixi/src/components/UI.svelte):
	// the SDK one renders the hardcoded gray UIDefault we can't customise per-game. Here,
	// `default` → our forge-themed ControlBar; `replay` → the stock UIReplay.
	type Props = {
		gameName: Snippet;
		logo: Snippet;
	};
	const props: Props = $props();
</script>

{#if stateUi.config.mode === 'replay'}
	<UIReplay>
		{#snippet gameName()}
			{@render props.gameName()}
		{/snippet}
		{#snippet logo()}
			{@render props.logo()}
		{/snippet}
	</UIReplay>
{:else}
	<ControlBar />
{/if}
