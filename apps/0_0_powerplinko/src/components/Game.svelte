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
	// Fireball geometry. Tune these in static/art/align.html (the "Fireball" section)
	// and paste the values back here so the ball lines up with the art.
	const START_X = 638; // fireball spawn x
	const START_Y = 173; // fireball spawn y (drops onto the wheel from here)
	const LAUNCH_X = 249; // launch point x — where the ball is flung off the wheel
	const LAUNCH_Y = 387; // launch point y — ball rests here before the fling
	const BALL_R = 26;
	const BK_X0 = 340; // bucket strip left
	const BK_W = 715; // bucket strip width (9 buckets)
	const bandX = (b: number) => BK_X0 + ((b + 0.5) / TOTAL_BANDS) * BK_W;
	const TRACK_Y = 556; // bucket-rim line the ball bounces along before settling
	const LAND_Y = 580; // resting spot inside the bucket mouth
	// speaker (mute) icon, bottom-left. Tune position in static/art/align.html.
	const MUTE_X = 48;
	const MUTE_Y = 716;
	const MUTE_SCALE = 1.5;

	const DROP_MS = 360;
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const fmt = (m: number) => `${m}`;
	const waitMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	// --- demo wallet (the real bet/balance is RGS-managed; this is a local sim) ---
	// bet ladder: familiar low values, then an UNBOUNDED 1–2–5 progression (no max bet)
	const BET_BASE = [0.1, 0.2, 0.5, 1, 2, 5, 10, 25, 50, 100];
	const betValue = (i: number) => {
		if (i < BET_BASE.length) return BET_BASE[i];
		const j = i - BET_BASE.length; // steps past 100
		const mant = [2, 5, 10][j % 3]; // 200, 500, 1000, then ×10 each cycle
		return mant * 100 * Math.pow(10, Math.floor(j / 3));
	};
	const HISTORY_MAX = 7;
	let balance = $state(1000);
	let betIndex = $state(3); // $1
	const bet = $derived(betValue(betIndex));
	const canDrop = $derived(balance >= bet);
	// readouts shrink their font as digits grow so big bets/balances still fit their slot
	const fitFont = (s: string, maxChars: number, base = 23, min = 11) =>
		s.length <= maxChars ? base : Math.max(min, Math.round((base * maxChars) / s.length));
	const betText = $derived(`$${bet.toFixed(2)}`);
	const balText = $derived(`$${balance.toFixed(2)}`);
	const betFont = $derived(fitFont(betText, 8));
	const balFont = $derived(fitFont(balText, 11));
	// `net` = payout - stake: the actual money change. net>0 win, net<0 loss, 0 even.
	// (A 0.5x landing pays back half the stake, so it's a LOSS, not a win.)
	let history = $state<{ id: number; mult: number; net: number }[]>([]);
	let lastResult = $state<{ mult: number; net: number } | null>(null);

	// --- sound: a chime on a winning result (net > 0), toggled by the speaker icon ---
	let muted = $state(false);
	let winAudio: HTMLAudioElement | null = null;
	const playWin = () => {
		if (muted || typeof Audio === 'undefined') return;
		try {
			// clone a preloaded element so rapid auto-drop wins can overlap
			const a = (winAudio ??= new Audio('./sfx/win.mp3')).cloneNode() as HTMLAudioElement;
			a.volume = 0.6;
			void a.play().catch(() => {});
		} catch {
			/* autoplay/codec issues are non-fatal */
		}
	};

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
	const betUp = () => !autoDropping && betIndex++; // no upper cap — bet can grow without limit
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
		balls.push({ id, x: START_X, y: START_Y });
		const node = balls[balls.length - 1]; // reactive proxy

		// 1) drop from the spawn point onto the spinning wheel's launch spot
		await animateOne(node, DROP_MS, (t) => [lerp(START_X, LAUNCH_X, t), lerp(START_Y, LAUNCH_Y, t * t)]);

		// 2) flung off the wheel, then a DAMPED RATTLE across the bucket margins: each
		//    bounce hits a divider (wall) and jumps to another, with the jump distance
		//    DECLINING (or staying equal) each time — never growing — until it drops into
		//    the target bucket's CENTRE. Randomised per drop (jump count, sizes, start
		//    side) so two balls in the SAME bucket differ. Purely cosmetic: `band` (the
		//    RGS outcome) is the ONLY decider — the walk always ends on bandX(band).
		const lx = bandX(band);
		// margin x for divider index d (0..TOTAL_BANDS). Bucket b sits between dividers
		// b and b+1, so its walls are at dividerX(b) and dividerX(b+1).
		const dividerX = (d: number) => BK_X0 + (d / TOTAL_BANDS) * BK_W;

		// Jump sizes in BUCKETS, forward order, NON-INCREASING (decline or equal, never up).
		const nJumps = 4 + Math.floor(Math.random() * 3); // 4–6 bounces between buckets
		const jumps: number[] = [];
		let mag = Math.random() < 0.5 ? 2 : 3; // first (biggest) jump: 2–3 buckets
		for (let k = 0; k < nJumps; k++) {
			jumps.push(mag);
			if (Math.random() < 0.45) mag = Math.max(1, mag - 1); // shrink or stay, min 1 bucket
		}

		// Build the margin walk BACKWARDS from a wall of the target so it always converges:
		// apply the jumps reversed (so forward they decline), alternating side to rattle
		// back and forth, flipping only when a side would leave the strip [0, TOTAL_BANDS].
		const divs: number[] = [Math.random() < 0.5 ? band : band + 1];
		let side = Math.random() < 0.5 ? 1 : -1;
		for (let k = nJumps - 1; k >= 0; k--) {
			const g = jumps[k];
			const here = divs[divs.length - 1];
			if (side > 0 && here + g > TOTAL_BANDS) side = -1;
			else if (side < 0 && here - g < 0) side = 1;
			divs.push(here + side * g);
			side = -side; // alternate -> bounces back and forth
		}
		divs.reverse(); // forward: where the fling lands -> ... -> a wall of the target

		// touchdowns: each margin (on the rim line), then the target CENTRE (drops in)
		const xs = divs.map(dividerX);
		xs.push(lx);

		// Animate each hop as a real projectile arc under CONSTANT GRAVITY: vertical follows
		// a parabola (fast near the ground, momentarily still only at the apex), horizontal
		// speed is constant within a hop, and each hop's air time scales with sqrt(apex) so
		// every arc shares the SAME gravity — tall early arcs hang, the shrinking settle hops
		// get quicker (the natural bouncing cadence). No artificial easing.
		const GRAVITY_C = 25; // ms per sqrt(px of apex); larger = slower / heavier gravity
		const arc = (t: number) => 4 * t * (1 - t); // parabola => constant-gravity vertical
		let bouncePeak = 170; // first bounce apex; each later bounce strictly lower
		let px = LAUNCH_X;
		let py = LAUNCH_Y;
		for (let k = 0; k < xs.length; k++) {
			const x0 = px;
			const y0 = py;
			const tx = xs[k];
			const fling = k === 0;
			const last = k === xs.length - 1;
			const ty = last ? LAND_Y : TRACK_Y;
			let pk: number;
			if (fling) pk = 230 + distance * 90; // launch arc
			else if (last) pk = 16; // small final settle into the cup
			else {
				pk = bouncePeak;
				bouncePeak *= 0.68; // restitution: each bounce loses height
			}
			const dur = Math.max(90, GRAVITY_C * Math.sqrt(pk));
			await animateOne(node, dur, (t) => [lerp(x0, tx, t), lerp(y0, ty, t) - pk * arc(t)]);
			px = tx;
			py = ty;
		}

		const win = multiplier * stake;
		balance += win;
		const net = win - stake;
		if (net > 0) playWin(); // chime only on an actual win (0.5x is a net loss)
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
		<image href="./art/bg.png" x="0" y="0" width={VW} height={VH} />

		<!-- spinning rune wheel, seated in the left disc -->
		<image href="./art/rotor.png" x="87" y="223" width="329" height="329" class="wheel" />

		<!-- landing buckets -->
		<image href="./art/buckets.png" x={BK_X0} y="536" width={BK_W} height="151" />

		<!-- per-mode bucket coefficients overlaid (baked labels masked by a dark pill;
		     when the buckets art is redesigned label-free, the pills can be dropped) -->
		{#each bandMultipliers as m, b}
			<rect x={bandX(b) - 26.5} y="636" width="53" height="28" rx="6" class="blabel-bg" />
			<text x={bandX(b)} y="655" text-anchor="middle" class="blabel">{fmtMult(m)}</text>
		{/each}

		<!-- fireballs in flight -->
		{#each balls as ball (ball.id)}
			<image
				href="./art/orb.png"
				x={ball.x - BALL_R}
				y={ball.y - BALL_R}
				width={BALL_R * 2}
				height={BALL_R * 2}
				class="orb"
			/>
		{/each}

		<!-- live values over the baked slots -->
		<text x="170" y="136" class="val" style="font-size:{balFont}px">{balText}</text>
		<text x="980" y="136" text-anchor="middle" class="val" style="font-size:{betFont}px">{betText}</text>
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

		<!-- recent plays header (baked title removed from bg.png; this overlays it back,
		     same .section style as RISK MODE). Position tuned via static/art/align.html. -->
		<text x="1128" y="146" class="section">RECENT PLAYS</text>

		<!-- recent plays list -->
		{#each history as h, i (h.id)}
			<text x="1148" y={194 + i * 41} class="rp" class:win={h.net > 0} class:loss={h.net < 0}>×{fmt(h.mult)}</text>
			<text x="1325" y={194 + i * 41} text-anchor="end" class="rp-amt" class:win={h.net > 0} class:loss={h.net < 0}>
				{h.net > 0 ? `+$${h.net.toFixed(2)}` : h.net < 0 ? `-$${Math.abs(h.net).toFixed(2)}` : '$0.00'}
			</text>
		{/each}

		<!-- risk-mode selector, under the recent plays history -->
		<text x="1128" y="609" class="section">RISK MODE</text>
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

		<!-- mute / unmute toggle (bottom-left) -->
		<g
			class="mute"
			class:muted
			transform="translate({MUTE_X} {MUTE_Y}) scale({MUTE_SCALE})"
			role="button"
			aria-label={muted ? 'unmute sound' : 'mute sound'}
			onclick={() => (muted = !muted)}
		>
			<rect x="-2" y="-2" width="28" height="28" fill="transparent" />
			{#if muted}
				<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 15.91 21 14.01 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.34 2.93 2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.59l4.18 4.18c-.65.49-1.38.88-2.18 1.11v2.06c1.34-.3 2.57-.92 3.61-1.75l2.05 2.05 1.41-1.41L4.34 2.93zM12 4 9.91 6.09 12 8.18V4z" />
			{:else}
				<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
			{/if}
		</g>
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

	/* speaker / mute toggle */
	.mute {
		cursor: pointer;
	}
	.mute path {
		fill: #c7cedb;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
		transition: fill 0.15s;
	}
	.mute:hover path {
		fill: #ffd34d;
	}
	.mute.muted path {
		fill: #6b7486;
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
