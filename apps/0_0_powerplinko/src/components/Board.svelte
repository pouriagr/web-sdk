<script lang="ts">
	import { onMount } from 'svelte';

	import { Sprite, Text, Rectangle, Container, Graphics } from 'pixi-svelte';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { getMode, fmtMult, TOTAL_BANDS } from '../game/modes';
	import { pushResult } from '../game/stateHistory.svelte';

	const context = getContext();

	// --- geometry, in the chassis art's native pixel space (bg.png = 1372x784).
	// MainContainer scales this whole box to fit the device; stateLayout.mainSizesMap
	// is set to the same 1372x784 so these coordinates map 1:1 (see stateLayout.ts).
	const VW = 1372;
	const VH = 784;
	// Fit to the (2026-06-29) bg.png art — socket left-of-centre, forge chute top-centre, bucket
	// trough across the bottom. Verified by compositing the sprites onto bg at these coords (rotor
	// seats in the socket, orb spawns in the chute, buckets + labels sit in the trough). To re-tune
	// after an art change, drag the guides in static/art/align.html over the bg and paste the values
	// back. Coordinate space is the art's native 1372x784.
	// rune wheel disc (rotor.png), spun in place around its centre (= the bg socket)
	const WHEEL = { x: 263, y: 332, size: 314 };
	// fireball flight: spawn at the forge chute -> drop onto the wheel -> flung into a bucket
	const START_X = 832;
	const START_Y = 76;
	const LAUNCH_X = 263;
	const LAUNCH_Y = 332;
	const BALL_R = 46;
	// landing buckets strip (9 buckets) — sits in the bottom trough
	const BK_X0 = 458;
	const BK_W = 761;
	const BK_Y = 517;
	const BK_H = 162;
	const bandX = (b: number) => BK_X0 + ((b + 0.5) / TOTAL_BANDS) * BK_W;
	// Per-band nudge for the COEFFICIENT LABEL only: the left cups (bands 0–3) read a touch
	// left of the evenly-spaced bandX, so shift those labels slightly right. Tune as needed.
	const LABEL_DX = [5, 4, 7, 4, 0, 0, 0, 0, 0];
	const labelX = (b: number) => bandX(b) + (LABEL_DX[b] ?? 0);
	const TRACK_Y = 551; // bucket-rim line the ball rattles along before settling
	const LAND_Y = 576; // resting spot inside the bucket mouth
	// The orb is occluded by the cauldron's front rim so it reads as sitting INSIDE the cup.
	// The cauldron mouth is round, so the cut is a CURVE (an arc), not a flat line: deepest at
	// the bucket centre, rising toward the sides — matching the molten front lip in the art.
	// Anything below the arc is masked away, revealing the bucket art drawn behind the orb.
	// TUNE by eye in the running game (or via static/art/align.html): RIM_CLIP_Y sets how deep
	// the centre cut sits; RIM_CURVE sets how round it is (rise from centre to the sides).
	const RIM_CLIP_Y = 569; // deepest point of the cut, at the bucket centre (≈ orb centre)
	const RIM_CURVE = 17; // how much the rim rises toward the bucket sides (the roundness)
	const LABEL_Y = 603; // y of the per-bucket coefficient label (on the cup body)
	// (the "EMBER ROTOR" title is now baked into bg.png — no separate title sprite)

	// Risk mode selects the bucket coefficients (source of truth:
	// math game_config.distance_bands_by_mode, mirrored in modes.ts). The active mode is
	// the RGS bet mode (stateBet.activeBetModeKey); the RISK MODE selector now lives in
	// the control bar (components/RiskModeSelector.svelte), not on the board.
	const mode = $derived(getMode(stateBet.activeBetModeKey));
	const bandMultipliers = $derived(mode.multipliers); // length TOTAL_BANDS

	// --- spinning rune wheel (constant speed, ~1 rev / 6s like the old CSS spin) ---
	let wheelRotation = $state(0);
	const SPIN_RAD_PER_MS = (2 * Math.PI) / 6000;

	// --- balls in flight (reactive; pixi-svelte syncs x/y/rotation/alpha to each <Sprite>) ---
	type Ball = { id: number; x: number; y: number; rotation: number; alpha: number; clipped: boolean };
	let balls = $state<Ball[]>([]);
	let ballSeq = 0;
	let destroyed = false;

	// landed-multiplier popup (cosmetic feedback above the bucket the ball settled in)
	let landed = $state<{ x: number; mult: number } | null>(null);
	let landedTimer: ReturnType<typeof setTimeout> | undefined;

	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
	const waitMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	const animateOne = (ball: Ball, durationMs: number, compute: (t: number) => [number, number]) =>
		new Promise<void>((resolve) => {
			let start = 0;
			const step = (ts: number) => {
				if (destroyed) return resolve();
				if (!start) start = ts;
				const t = Math.min(1, (ts - start) / durationMs);
				const [x, y] = compute(t);
				// roll the ball: spin proportional to horizontal travel (realistic tumble)
				ball.rotation += (x - ball.x) / BALL_R;
				ball.x = x;
				ball.y = y;
				if (t < 1) requestAnimationFrame(step);
				else resolve();
			};
			requestAnimationFrame(step);
		});

	// fade a landed ball out before removing it
	const fadeOut = (ball: Ball, durationMs: number) =>
		new Promise<void>((resolve) => {
			let start = 0;
			const step = (ts: number) => {
				if (destroyed) return resolve();
				if (!start) start = ts;
				const t = Math.min(1, (ts - start) / durationMs);
				ball.alpha = 1 - t;
				if (t < 1) requestAnimationFrame(step);
				else resolve();
			};
			requestAnimationFrame(step);
		});

	// Animate one throw to the RGS-chosen landing band. The flight is purely cosmetic:
	// `band` is the only thing that decides where the ball ends up. A ball drops onto the
	// spinning wheel, is flung off it, then a DAMPED RATTLE across the bucket margins
	// (each bounce hits a divider and jumps to another, jump distance non-increasing,
	// arc height decaying) until it settles into the target bucket's centre. Randomised
	// per drop so two balls in the same bucket take different paths.
	const spawnBall = async (band: number, distance: number, multiplier: number) => {
		const id = ++ballSeq;
		balls.push({ id, x: START_X, y: START_Y, rotation: 0, alpha: 1, clipped: false });
		const node = balls[balls.length - 1]; // reactive proxy

		// Turbo shortens the WHOLE flight (drop + rattle); the settle tail below is also
		// turbo-gated. Read once at spawn. (Auto-play pacing — drop every ~1s without waiting —
		// is handled separately in bookEventHandlerMap.)
		const tf = stateBet.isTurbo ? 0.35 : 1;

		// 1) drop from the spawn point onto the wheel's launch spot
		await animateOne(node, 360 * tf, (t) => [lerp(START_X, LAUNCH_X, t), lerp(START_Y, LAUNCH_Y, t * t)]);

		// 2) build the margin walk BACKWARDS from a wall of the target so it always
		//    converges. Jump sizes (in buckets) are non-increasing; sides alternate.
		// Land aligned with the bucket's COEFFICIENT label (labelX), not the raw cup centre.
		const lx = labelX(band);
		const dividerX = (d: number) => BK_X0 + (d / TOTAL_BANDS) * BK_W;

		const nJumps = 4 + Math.floor(Math.random() * 3); // 4–6 bounces between buckets
		const jumps: number[] = [];
		let mag = Math.random() < 0.5 ? 2 : 3; // first (biggest) jump: 2–3 buckets
		for (let k = 0; k < nJumps; k++) {
			jumps.push(mag);
			if (Math.random() < 0.45) mag = Math.max(1, mag - 1);
		}

		const divs: number[] = [Math.random() < 0.5 ? band : band + 1];
		let side = Math.random() < 0.5 ? 1 : -1;
		for (let k = nJumps - 1; k >= 0; k--) {
			const g = jumps[k];
			const here = divs[divs.length - 1];
			if (side > 0 && here + g > TOTAL_BANDS) side = -1;
			else if (side < 0 && here - g < 0) side = 1;
			divs.push(here + side * g);
			side = -side;
		}
		divs.reverse(); // forward: where the fling lands -> ... -> a wall of the target

		const xs = divs.map(dividerX);
		xs.push(lx); // final touchdown: aligned with the target bucket's coefficient label

		// each hop is a constant-gravity projectile arc (parabolic vertical, constant
		// horizontal speed, air time ∝ sqrt(apex) so all arcs share one gravity).
		const GRAVITY_C = 25;
		const arc = (t: number) => 4 * t * (1 - t);
		let bouncePeak = 170;
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
			if (fling) pk = 230 + distance * 90;
			else if (last) pk = 16;
			else {
				pk = bouncePeak;
				bouncePeak *= 0.68;
			}
			// On the final hop, turn on the rim mask so the orb is occluded by the cauldron's
			// front lip as it drops in (no abrupt snap — it disappears into the cup mid-descent).
			if (last) node.clipped = true;
			const dur = Math.max(90, GRAVITY_C * Math.sqrt(pk)) * tf;
			await animateOne(node, dur, (t) => [lerp(x0, tx, t), lerp(y0, ty, t) - pk * arc(t)]);
			px = tx;
			py = ty;
		}

		// show the landed multiplier briefly
		landed = { x: lx, mult: multiplier };
		clearTimeout(landedTimer);
		landedTimer = setTimeout(() => (landed = null), 1600);

		// settle a beat (nestled in the cup), then fade the ball away and remove it.
		// Keep it brief in Turbo so it doesn't drag across auto rounds.
		await waitMs(stateBet.isTurbo ? 80 : 220);
		await fadeOut(node, stateBet.isTurbo ? 160 : 450);
		const i = balls.findIndex((b) => b.id === id);
		if (i >= 0) balls.splice(i, 1);
	};

	context.eventEmitter.subscribeOnMount({
		wheelThrow: async ({ data }) => {
			landed = null;
			await spawnBall(data.band, data.distance, data.multiplier);
			// record the landed result for the cosmetic last-10 history strip
			pushResult(data.multiplier);
		},
	});

	onMount(() => {
		let raf = 0;
		let prev = 0;
		const tick = (ts: number) => {
			if (destroyed) return;
			if (prev) wheelRotation += (ts - prev) * SPIN_RAD_PER_MS;
			prev = ts;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			destroyed = true;
			cancelAnimationFrame(raf);
			clearTimeout(landedTimer);
		};
	});
</script>

<!-- full chassis background (board-only forge art; the title is baked into bg.png) -->
<Sprite key="bg" x={0} y={0} width={VW} height={VH} />

<!-- spinning rune wheel, seated in the left disc -->
<Sprite
	key="rotor"
	x={WHEEL.x}
	y={WHEEL.y}
	width={WHEEL.size}
	height={WHEEL.size}
	anchor={0.5}
	rotation={wheelRotation}
/>

<!-- landing buckets + per-mode coefficient labels (baked labels masked by a pill;
     drop the pills once the buckets art is redrawn label-free) -->
<Sprite key="buckets" x={BK_X0} y={BK_Y} width={BK_W} height={BK_H} />
{#each bandMultipliers as m, b (b)}
	<Rectangle
		x={labelX(b)}
		y={LABEL_Y}
		anchor={0.5}
		width={54}
		height={26}
		borderRadius={6}
		backgroundColor={0x0a0d12}
		backgroundAlpha={0.72}
	/>
	<Text
		x={labelX(b)}
		y={LABEL_Y}
		anchor={0.5}
		text={fmtMult(m)}
		style={{ fontFamily: 'proxima-nova', fontWeight: '700', fontSize: 15, fill: 0xffe9a8 }}
	/>
{/each}

<!-- landed-multiplier popup -->
{#if landed}
	<Text
		x={landed.x}
		y={LAND_Y - 70}
		anchor={0.5}
		text={`×${fmtMult(landed.mult)}`}
		style={{ fontFamily: 'proxima-nova', fontWeight: '700', fontSize: 30, fill: 0xffd34d }}
	/>
{/if}

<!-- fireballs in flight (roll during flight; on landing they sink behind the cauldron rim,
     then fade out). Each ball gets its own Container so its rim mask clips only that orb. -->
{#each balls as ball (ball.id)}
	<Container>
		{#if ball.clipped}
			<!-- mask = everything above the cauldron's ROUND front rim (a downward arc, deepest
			     at centre). The orb's lower part is hidden, revealing the cauldron art behind it.
			     Drawn in local space centred at 0; x tracks the orb through the final hop. -->
			<Graphics
				isMask
				x={ball.x}
				draw={(g) => {
					const halfW = BALL_R + 8;
					const sideY = RIM_CLIP_Y - RIM_CURVE; // rim is higher (smaller y) at the sides
					const ctrlY = RIM_CLIP_Y + RIM_CURVE; // control pt so the arc dips to RIM_CLIP_Y at centre
					g.moveTo(-halfW, 0);
					g.lineTo(halfW, 0);
					g.lineTo(halfW, sideY);
					g.quadraticCurveTo(0, ctrlY, -halfW, sideY);
					g.closePath();
					g.fill({ color: 0x000000, alpha: 1 });
				}}
			/>
		{/if}
		<Sprite
			key="orb"
			x={ball.x}
			y={ball.y}
			width={BALL_R * 2}
			height={BALL_R * 2}
			anchor={0.5}
			rotation={ball.rotation}
			alpha={ball.alpha}
		/>
	</Container>
{/each}
