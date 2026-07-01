<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateConfig, stateUrlDerived } from 'state-shared';

	import { GAME_MODES, fmtMult, TOTAL_BANDS } from '../game/modes';

	const showRTP = $derived(stateConfig.jurisdiction.displayRTP);
	// Social mode forbids "bet"/"buy"/"pay": swap the wager noun in the copy below.
	const social = stateUrlDerived.social();
	const bw = social ? 'play amount' : 'bet';

	// App-local Pay Table modal (the SDK ModalPayTable is a stub). Shows each risk mode's
	// nine bucket coefficients. No probabilities/hit-rates are shown (compliance). Source:
	// modes.ts (mirror of the math distance_bands_by_mode).
	const { version }: { version?: Snippet } = $props();
	const bandHeaders = Array.from({ length: TOTAL_BANDS }, (_, i) => i + 1);
</script>

{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="paytable">
			<h1>{social ? 'Multipliers' : 'Pay Table'}</h1>
			<p>
				Coefficients are multiples of your {bw} for landing in each bucket (1 = nearest, {TOTAL_BANDS} =
				farthest). {social ? 'Every mode uses the same play amount' : 'All modes cost 1× the bet'}{#if showRTP} and return 96%{/if}.
			</p>
			<div class="scroll">
				<table>
					<thead>
						<tr>
							<th>Bucket</th>
							{#each bandHeaders as h (h)}<th>{h}</th>{/each}
						</tr>
					</thead>
					<tbody>
						{#each GAME_MODES as m (m.key)}
							<tr>
								<td class="mode">{m.label}</td>
								{#each m.multipliers as mult, b (b)}
									<td class:zero={mult === 0}>{fmtMult(mult)}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if version}
				<div class="version">{@render version()}</div>
			{/if}
		</div>
	</Popup>
{/if}

<style lang="scss">
	.paytable {
		font-family: 'proxima-nova', sans-serif;
		color: #e7ecf5;
		max-width: 90vw;
		padding: 1.5rem 1.75rem;
		text-align: center;
	}
	h1 {
		font-size: 1.6rem;
		color: #ffd34d;
		margin: 0 0 0.5rem;
	}
	p {
		font-size: 0.9rem;
		color: #c7cedb;
		margin: 0 auto 1rem;
		max-width: 540px;
	}
	.scroll {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		margin: 0 auto;
		font-size: 0.9rem;
	}
	th,
	td {
		border: 1px solid #3a4252;
		padding: 0.4rem 0.55rem;
		text-align: center;
		white-space: nowrap;
	}
	th {
		color: #8a93a6;
		font-weight: 700;
	}
	td {
		color: #ffe9a8;
	}
	td.mode {
		color: #c7cedb;
		font-weight: 700;
		text-align: left;
	}
	td.zero {
		color: #6b7486;
	}
	.version {
		margin-top: 1rem;
		font-size: 0.8rem;
		color: #6b7486;
	}
</style>
