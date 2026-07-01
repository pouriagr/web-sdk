<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateConfig, stateUrlDerived } from 'state-shared';

	import { GAME_MODES, fmtMult } from '../game/modes';

	// Some jurisdictions gate whether the theoretical RTP may be shown to players.
	const showRTP = $derived(stateConfig.jurisdiction.displayRTP);
	// Stake.US social mode forbids "bet"/"buy"/"pay" in player-facing copy. Swap the wager noun
	// and keep the control descriptions restricted-word-free. (social() is URL-based, stable.)
	const social = stateUrlDerived.social();
	const bw = social ? 'play amount' : 'bet';

	// App-local Game Rules modal with real Ember Rotor content. The SDK's ModalGameRules
	// is a stub ("ADD YOUR GAME RULES") that ignores gameRuleMeta, so we render our own
	// (wired via the app-local Modals.svelte). Ladders come from modes.ts (mirror of the
	// math game_config.distance_bands_by_mode) so rules stay in sync with the math.
	const modeRows = GAME_MODES.map((m) => ({
		label: m.label,
		maxWin: fmtMult(m.multipliers[m.multipliers.length - 1]),
		ladder: m.multipliers.map(fmtMult).join('  ·  '),
	}));

	// Every interactive control must be explained (Stake compliance). These MATCH the actual
	// custom control bar: DROP, STOP (DROP's label while an auto-run is stopping), − / +, RISK,
	// AUTO, TURBO, MENU (which opens Pay Table / Game Rules / Sound). Descriptions avoid the
	// restricted words so they're valid in social mode too.
	const ui = [
		['DROP', 'Drop a ball to play one round.'],
		['STOP', 'Stop an in-progress auto-play run.'],
		['+ / −', `Increase / decrease your ${bw}.`],
		['RISK', social
			? 'Switch the risk table (Low / Medium / High). Every mode uses the same play amount.'
			: 'Switch the risk table (Low / Medium / High). All modes cost the same.'],
		['AUTO', 'Open auto-play: number of rounds plus optional loss and single-win limits, then START.'],
		['TURBO', 'Speed up the ball drop.'],
		['MENU', `Open the menu — ${social ? 'Multipliers' : 'Pay Table'}, Game Rules, and Sound on/off.`],
	];
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="rules">
			<h1>Ember Rotor — Game Rules</h1>

			<section>
				<h2>How to play</h2>
				<p>
					Each round drops a single ball onto the spinning rune-rotor, which flings it into one of nine
					distance buckets along the track. The bucket it lands in sets your win: <b
						>bucket coefficient × your {bw}</b
					>. Farther buckets are worth more but are rarer. There is one ball per round, and the landing bucket
					is decided by the Remote Game Server — the on-screen flight is for illustration only.
				</p>
			</section>

			<section>
				<h2>Risk modes</h2>
				<p>
					Three risk modes share the same nine buckets but use different coefficient ladders. Every
					mode {social ? 'is played for' : 'costs'} <b>1× your {bw}</b>{#if showRTP} and has a theoretical return to player (RTP) of
						<b>96%</b>{/if}.
				</p>
				<table>
					<thead>
						<tr><th>Mode</th><th>Max win</th><th>Coefficients (nearest → farthest)</th></tr>
					</thead>
					<tbody>
						{#each modeRows as r (r.label)}
							<tr><td>{r.label}</td><td>{r.maxWin}</td><td class="ladder">{r.ladder}</td></tr>
						{/each}
					</tbody>
				</table>
			</section>

			<section>
				<h2>Controls</h2>
				<dl>
					{#each ui as [name, desc] (name)}
						<div class="row"><dt>{name}</dt><dd>{desc}</dd></div>
					{/each}
				</dl>
			</section>

			<section>
				<p class="disclaimer">
					Malfunction voids all wins and plays. A consistent internet connection is required. In the
					event of a disconnection, reload the game to finish any uncompleted rounds. The expected
					return is calculated over many plays. The game display is not representative of any physical
					device and is for illustrative purposes only. Winnings are settled according to the amount
					received from the Remote Game Server and not from events within the web browser. TM and ©
					2026 Stake Engine.
				</p>
			</section>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.rules {
		font-family: 'proxima-nova', sans-serif;
		color: #e7ecf5;
		max-width: 720px;
		max-height: 80vh;
		overflow-y: auto;
		padding: 1.5rem 1.75rem;
		text-align: left;
		line-height: 1.5;
	}
	h1 {
		font-size: 1.6rem;
		color: #ffd34d;
		margin: 0 0 1rem;
		text-align: center;
	}
	h2 {
		font-size: 1.1rem;
		color: #f5d042;
		margin: 1.25rem 0 0.4rem;
	}
	p {
		margin: 0.4rem 0;
		font-size: 0.95rem;
	}
	b {
		color: #ffe9a8;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
	th,
	td {
		border: 1px solid #3a4252;
		padding: 0.4rem 0.6rem;
		text-align: left;
	}
	th {
		color: #8a93a6;
		font-weight: 700;
	}
	.ladder {
		color: #ffe9a8;
		white-space: nowrap;
	}
	dl {
		margin: 0.5rem 0 0;
	}
	.row {
		display: flex;
		gap: 0.75rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid rgba(58, 66, 82, 0.5);
	}
	dt {
		flex: 0 0 9rem;
		font-weight: 700;
		color: #c7cedb;
	}
	dd {
		margin: 0;
		flex: 1;
		font-size: 0.9rem;
	}
	.disclaimer {
		margin-top: 1rem;
		font-size: 0.8rem;
		color: #9aa3b2;
		border-top: 1px solid #3a4252;
		padding-top: 0.75rem;
	}
</style>
