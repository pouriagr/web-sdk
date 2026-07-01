<script lang="ts">
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';
	import { UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';

	import UI from './UI.svelte';
	import Modals from './Modals.svelte';
	import Sound from './Sound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Background from './Background.svelte';
	import Board from './Board.svelte';
	import HistoryStrip from './HistoryStrip.svelte';
	import BalanceLabel from './BalanceLabel.svelte';
	import BottomPanel from './BottomPanel.svelte';
</script>

<!--
	web-sdk Pixi shell (mirrors apps/lines), but the bottom controls come from our own
	app-local <UI> (./UI.svelte) — a forge-themed ControlBar in default mode, the stock
	SDK UIReplay in replay mode. It still drives the round through the RGS via the game
	actor (EnableGameActor): pressing DROP broadcasts `bet` -> requestBet -> book ->
	bookEventHandlerMap -> the board animation. The board itself is our plinko scene
	(Board.svelte), drawn in pixi-svelte; HistoryStrip shows the last-10 results on it.
-->
<App>
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />
	<ResumeBet />
	<Sound />

	<MainContainer>
		<Board />
		<HistoryStrip />
		<BalanceLabel />
	</MainContainer>

	<!-- bet-bar tray (behind the UI bar) so controls sit on a panel, not on the board -->
	<BottomPanel />

	<UI>
		{#snippet gameName()}
			<UiGameName name="EMBER ROTOR" />
		{/snippet}
		{#snippet logo()}
			<!-- title/logo is rendered on the board (Board.svelte) so it can be positioned over
			     the forge art; the top-right UI logo slot is intentionally empty. -->
		{/snippet}
	</UI>
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
