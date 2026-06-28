<script lang="ts">
	import './app.css';
	import { onDestroy } from 'svelte';
	import { getContext } from '../game/context';
	import EnableGameActor from './EnableGameActor.svelte';
	import { GAME_MODES, getMode, fmtMult, DEFAULT_MODE, TOTAL_BANDS } from '../game/modes';

	const context = getContext();

	// Optional override for DROP. Stories pass this the selected risk mode and play a
	// mock book for it (no RGS); in the real app it is omitted -> bet via the RGS.
	let { onDrop }: { onDrop?: (modeKey: string) => void } = $props();

	// Risk mode selects the bucket coefficients (math source of truth:
	// game_config.distance_bands_by_mode). Default Medium; switched in-game.
	let selectedModeKey = $state<string>(DEFAULT_MODE);
	const mode = $derived(getMode(selectedModeKey));
	const bandMultipliers = $derived(mode.multipliers); // length TOTAL_BANDS

	// All geometry is in BACKGROUND-IMAGE pixels (viewBox 0 0 1372 784) so overlays
	// line up exactly with the baked chassis art (bg.png).
	const VW = 1372;
	const VH = 784;
	const WHEEL_CX = 252; // centre of the left disc
	const WHEEL_CY = 388;
	const LAUNCH_Y = 290; // ball sits here on the wheel before being flung
	const DROP_FROM_Y = 185; // ball drops in from above the wheel
	const BALL_R = 26;
	const BK_X0 = 340; // bucket strip left
	const BK_W = 715; // bucket strip width (9 buckets)
	const bandX = (b: number) => BK_X0 + ((b + 0.5) / TOTAL_BANDS) * BK_W;
	const LAND_Y = 580; // inside the bucket mouth

	const FLIGHT_MS = 1300;
	const DROP_MS = 360;
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const fmt = (m: number) => `${m}`;
	const waitMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	// --- demo wallet (the real bet/balance is RGS-managed; this is a local sim) ---
	const BET_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 25, 50, 100];
	const HISTORY_MAX = 7;
	let balance = $state(1000);
	let betIndex = $state(3); // $1
	const bet = $derived(BET_STEPS[betIndex]);
	const canDrop = $derived(balance >= bet);
	// `net` = payout - stake: the actual money change. net>0 win, net<0 loss, 0 even.
	// (A 0.5x landing pays back half the stake, so it's a LOSS, not a win.)
	let history = $state<{ id: number; mult: number; net: number }[]>([]);
	let lastResult = $state<{ mult: number; net: number } | null>(null);

	// --- auto-drop: drop N balls in sequence at the current bet ---
	// Balls step 1 -> 5 -> 10 -> 15 ... 50 (and back down the same way).
	const BALLS_STEPS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
	const DROP_STAGGER_MS = 420; // gap between successive launches in an auto-run
	let ballsIndex = $state(0); // BALLS_STEPS[0] = 1
	const ballsCount = $derived(BALLS_STEPS[ballsIndex]);
	let autoDropping = $state(false);
	let dropsDone = $state(0); // progress within the current auto-run

	// controls are locked while an auto-run is in flight
	const betDown = () => !autoDropping && betIndex > 0 && betIndex--;
	const betUp = () => !autoDropping && betIndex < BET_STEPS.length - 1 && betIndex++;
	const ballsDown = () => !autoDropping && ballsIndex > 0 && ballsIndex--;
	const ballsUp = () => !autoDropping && ballsIndex < BALLS_STEPS.length - 1 && ballsIndex++;
	const selectMode = (key: string) => {
		if (!autoDropping) selectedModeKey = key;
	};

	// --- balls in flight (any number at once) ---
	type Ball = { id: number; x: number; y: number };
	let balls = $state<Ball[]>([]);
	let ballSeq = 0;
	const pendingBets: number[] = [];
	let destroyed = false;

	const animateOne = (ball: Ball, durationMs: number, compute: (t: number) => [number, number]) =>
		new Promise<void>((resolve) => {
			let start = 0;
			const step = (ts: number) => {
				if (destroyed) return resolve();
				if (!start) start = ts;
				const t = Math.min(1, (ts - start) / durationMs);
				const [x, y] = compute(t);
				ball.x = x;
				ball.y = y;
				if (t < 1) requestAnimationFrame(step);
				else resolve();
			};
			requestAnimationFrame(step);
		});

	const spawnBall = async (band: number, distance: number, multiplier: number, stake: number) => {
		const id = ++ballSeq;
		balls.push({ id, x: WHEEL_CX, y: DROP_FROM_Y });
		const node = balls[balls.length - 1]; // reactive proxy

		// 1) drop onto the spinning wheel
		await animateOne(node, DROP_MS, (t) => [WHEEL_CX, lerp(DROP_FROM_Y, LAUNCH_Y, t * t)]);
		// 2) flung off the wheel in a parabolic arc into the landing bucket
		const lx = bandX(band);
		const peak = 90 + distance * 170;
		await animateOne(node, FLIGHT_MS, (t) => {
			const x = lerp(WHEEL_CX, lx, t);
			const y = lerp(LAUNCH_Y, LAND_Y, t) - peak * Math.sin(Math.PI * t);
			return [x, y];
		});

		const win = multiplier * stake;
		balance += win;
		const net = win - stake;
		lastResult = { mult: multiplier, net };
		history.unshift({ id, mult: multiplier, net });
		if (history.length > HISTORY_MAX) history.splice(HISTORY_MAX);

		await waitMs(450);
		const i = balls.findIndex((b) => b.id === id);
		if (i >= 0) balls.splice(i, 1);
	};

	// one bet -> one book -> one ball. Each ball is an independent RGS outcome;
	// the frontend only animates it. Returns false if the balance can't cover it.
	function dropOne(): boolean {
		if (balance < bet) return false;
		balance -= bet;
		pendingBets.push(bet);
		if (onDrop) onDrop(selectedModeKey);
		else context.eventEmitter.broadcast({ type: 'bet' });
		return true;
	}

	// DROP launches `ballsCount` balls, staggered so they stream out one after another.
	async function drop() {
		if (autoDropping || balance < bet) return;
		const n = ballsCount;
		autoDropping = true;
		dropsDone = 0;
		for (let i = 0; i < n; i++) {
			if (!dropOne()) break; // ran out of balance mid-run
			dropsDone = i + 1;
			if (i < n - 1) await waitMs(DROP_STAGGER_MS);
		}
		autoDropping = false;
	}

	context.eventEmitter.subscribeOnMount({
		wheelThrow: async ({ data }) => {
			const stake = pendingBets.shift() ?? bet;
			await spawnBall(data.band, data.distance, data.multiplier, stake);
		},
		finalWin: () => {},
	});

	onDestroy(() => {
		destroyed = true;
	});
</script>

<EnableGameActor />

<div class="pp">
	<svg viewBox="0 0 {VW} {VH}" class="game" aria-label="Power Plinko">
		<!-- full chassis background -->
		<image href="/art/bg.png" x="0" y="0" width={VW} height={VH} />

		<!-- spinning rune wheel, seated in the left disc -->
		<image href="/art/rotor.png" x="87" y="223" width="329" height="329" class="wheel" />

		<!-- landing buckets -->
		<image href="/art/buckets.png" x={BK_X0} y="536" width={BK_W} height="151" />

		<!-- per-mode bucket coefficients overlaid (baked labels masked by a dark pill;
		     when the buckets art is redesigned label-free, the pills can be dropped) -->
		{#each bandMultipliers as m, b}
			<rect x={bandX(b) - 26.5} y="636" width="53" height="28" rx="6" class="blabel-bg" />
			<text x={bandX(b)} y="655" text-anchor="middle" class="blabel">{fmtMult(m)}</text>
		{/each}

		<!-- fireballs in flight -->
		{#each balls as ball (ball.id)}
			<image
				href="/art/orb.png"
				x={ball.x - BALL_R}
				y={ball.y - BALL_R}
				width={BALL_R * 2}
				height={BALL_R * 2}
				class="orb"
			/>
		{/each}

		<!-- live values over the baked slots -->
		<text x="170" y="136" class="val">${balance.toFixed(2)}</text>
		<text x="980" y="136" text-anchor="middle" class="val">${bet.toFixed(2)}</text>
		<!-- readout in the gap between DROP and the Balls control -->
		<text x="531" y="748" text-anchor="middle" class="result" class:win={!autoDropping && lastResult && lastResult.net > 0} class:loss={!autoDropping && lastResult && lastResult.net < 0}>
			{#if autoDropping}
				Dropping {dropsDone}/{ballsCount}…
			{:else if lastResult}
				{#if lastResult.net > 0}×{fmt(lastResult.mult)} — +${lastResult.net.toFixed(2)}{:else if lastResult.net < 0}×{fmt(lastResult.mult)} — -${Math.abs(lastResult.net).toFixed(2)}{:else}×{fmt(lastResult.mult)} — even{/if}
			{:else}Drop a ball{/if}
		</text>

		<!-- auto-drop ball count, shown between the Balls - and + buttons -->
		<text x="829" y="748" text-anchor="middle" class="val">{ballsCount}</text>

		<!-- recent plays list -->
		{#each history as h, i (h.id)}
			<text x="1148" y={194 + i * 41} class="rp" class:win={h.net > 0} class:loss={h.net < 0}>×{fmt(h.mult)}</text>
			<text x="1325" y={194 + i * 41} text-anchor="end" class="rp-amt" class:win={h.net > 0} class:loss={h.net < 0}>
				{h.net > 0 ? `+$${h.net.toFixed(2)}` : h.net < 0 ? `-$${Math.abs(h.net).toFixed(2)}` : '$0.00'}
			</text>
		{/each}

		<!-- risk-mode selector, under the recent plays history -->
		<text x="1128" y="620" class="section">RISK MODE</text>
		{#each GAME_MODES as gm, i (gm.key)}
			{@const top = gm.multipliers[gm.multipliers.length - 1]}
			<rect
				x="1128"
				y={637 + i * 45}
				width="202"
				height="34"
				rx="8"
				class="mode"
				class:sel={gm.key === selectedModeKey}
				class:off={autoDropping}
				role="button"
				aria-label={`risk ${gm.label}`}
				onclick={() => selectMode(gm.key)}
			/>
			<text x="1148" y={637 + i * 45 + 24} class="mode-label" class:sel={gm.key === selectedModeKey}>{gm.label}</text>
			<text x="1313" y={637 + i * 45 + 24} text-anchor="end" class="mode-hint">max {fmtMult(top)}</text>
		{/each}

		<!-- transparent clickable hot-zones over the baked buttons -->
		<rect x="876" y="106" width="48" height="48" class="hit" class:off={autoDropping} role="button" aria-label="decrease bet" onclick={betDown} />
		<rect x="1033" y="106" width="48" height="48" class="hit" class:off={autoDropping} role="button" aria-label="increase bet" onclick={betUp} />
		<!-- auto-drop ball count -/+ -->
		<rect x="751" y="711" width="56" height="56" class="hit" class:off={autoDropping} role="button" aria-label="fewer balls" onclick={ballsDown} />
		<rect x="853" y="711" width="56" height="56" class="hit" class:off={autoDropping} role="button" aria-label="more balls" onclick={ballsUp} />
		<!-- drop (launches ballsCount balls) -->
		<rect
			x="213"
			y="708"
			width="162"
			height="60"
			class="hit"
			class:off={!canDrop || autoDropping}
			role="button"
			aria-label="drop"
			onclick={drop}
		/>
	</svg>
</div>

<style>
	.pp {
		display: flex;
		justify-content: center;
		width: 100%;
	}
	.game {
		width: min(98vw, 1372px);
		height: auto;
		aspect-ratio: 1372 / 784;
		display: block;
	}

	/* wheel spins around the disc centre */
	.wheel {
		transform-box: view-box;
		transform-origin: 251.5px 387.5px;
		animation: spin 6s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.orb {
		filter: drop-shadow(0 0 8px rgba(255, 140, 30, 0.9));
	}

	text {
		font-family: 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
	}
	.val {
		fill: #f5d042;
		font-size: 23px;
		font-weight: 800;
	}
	.result {
		fill: #c7cedb;
		font-size: 22px;
		font-weight: 800;
	}
	.result.win {
		fill: #ffd34d;
	}
	.rp {
		fill: #c7cedb;
		font-size: 20px;
		font-weight: 800;
	}
	.rp.win {
		fill: #ffd34d;
	}
	.rp-amt {
		fill: #6b7486;
		font-size: 18px;
		font-weight: 800;
	}
	.rp-amt.win {
		fill: #46c46b;
	}
	/* net loss (multiplier < 1, e.g. 0.5x pays back less than the stake): neutral
	   gray rather than red — honest (shows -$) without making the player feel bad. */
	.result.loss,
	.rp.loss,
	.rp-amt.loss {
		fill: #9aa3b2;
	}
	.hit {
		fill: transparent;
		cursor: pointer;
	}
	.hit.off {
		cursor: not-allowed;
	}

	/* per-mode bucket coefficient labels */
	.blabel-bg {
		fill: #0a0d12;
		opacity: 0.72;
	}
	.blabel {
		fill: #ffe9a8;
		font-size: 15px;
		font-weight: 800;
	}

	/* risk-mode selector */
	.section {
		fill: #8a93a6;
		font-size: 14px;
		font-weight: 800;
		letter-spacing: 0.08em;
	}
	.mode {
		fill: rgba(255, 255, 255, 0.03);
		stroke: #3a4252;
		stroke-width: 1.5;
		cursor: pointer;
	}
	.mode.sel {
		fill: rgba(245, 208, 66, 0.14);
		stroke: #f5d042;
		stroke-width: 2;
	}
	.mode.off {
		cursor: not-allowed;
	}
	.mode-label {
		fill: #c7cedb;
		font-size: 14px;
		font-weight: 800;
		pointer-events: none;
	}
	.mode-label.sel {
		fill: #ffd34d;
	}
	.mode-hint {
		fill: #6b7486;
		font-size: 13px;
		font-weight: 700;
		pointer-events: none;
	}
</style>
