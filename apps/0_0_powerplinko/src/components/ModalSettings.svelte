<script lang="ts">
	// App-local Settings modal. The shared SDK ModalSettings renders three volume channels
	// (Master / Music / Sound-Effect), each with ON/OFF + slider + number — overkill for a
	// game whose only audio is a win chime. We expose a single Sound ON/OFF toggle instead.
	// Same override pattern as our app-local ModalGameRules / ModalPayTable (Modals.svelte
	// deep-imports the SDK primitives directly — these workspace packages have no `exports`
	// restriction). Editing the shared package would change every game, so we keep it local.
	import { zIndex } from 'constants-shared/zIndex';
	import { Popup, Button } from 'components-shared';
	import { stateModal, stateSound } from 'state-shared';

	import BaseTitle from 'components-ui-html/src/components/BaseTitle.svelte';
	import BaseContent from 'components-ui-html/src/components/BaseContent.svelte';

	// `soundOn` mirrors the ControlBar "SOUND ON/OFF" menu item (both read volumeValueMaster
	// > 0), and the toggle uses the same 0 <-> 50 values so the two controls stay in sync.
	const soundOn = $derived(stateSound.volumeValueMaster > 0);
	const toggle = () => {
		stateSound.volumeValueMaster = soundOn ? 0 : 50;
	};
</script>

{#if stateModal.modal?.name === 'settings'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseTitle>Settings</BaseTitle>
			<div class="row">
				<span class="label">Sound</span>
				<div class="button-wrap">
					<Button onclick={toggle}>
						<span class="state">{soundOn ? 'ON' : 'OFF'}</span>
					</Button>
				</div>
			</div>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0;

		@media (min-width: 480px) {
			min-width: 360px;
		}
	}

	.label {
		font-size: 1.25rem;
	}

	.button-wrap {
		display: flex;
		align-items: center;
	}

	.state {
		padding: 0 0.5rem;
		font-weight: 700;
	}
</style>
