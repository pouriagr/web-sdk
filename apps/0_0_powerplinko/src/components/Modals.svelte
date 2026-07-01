<script lang="ts">
	import type { Snippet } from 'svelte';

	// App-local Modals: same set as the SDK components-ui-html <Modals>, but with the two
	// content modals (GameRules / PayTable) swapped for our own real-content versions — the
	// SDK ones are stubs ("ADD YOUR GAME RULES") that can't be filled through <Modals>.
	// The remaining modals are stable, so we reuse them directly (deep import — these
	// workspace packages have no `exports` restriction).
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';
	import ModalBuyBonus from 'components-ui-html/src/components/ModalBuyBonus.svelte';
	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from 'components-ui-html/src/components/ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';

	import ModalGameRules from './ModalGameRules.svelte';
	import ModalPayTable from './ModalPayTable.svelte';
	// App-local: single Sound ON/OFF toggle instead of the SDK's 3-channel volume modal.
	import ModalSettings from './ModalSettings.svelte';

	const { version }: { version: Snippet } = $props();
</script>

<ModalError />
<ModalBetMenu />
<ModalBuyBonus />
<ModalBuyBonusConfirm />
<ModalAutoSpin />
<ModalAutoSpinMessage />
<ModalPayTable {version} />
<ModalGameRules />
<ModalSettings />

<style lang="scss">
	:global(html) {
		font-size: 16px;
		@media screen and (max-width: 500px) {
			font-size: 50%;
		}
	}
</style>
