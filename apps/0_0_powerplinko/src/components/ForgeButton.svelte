<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { PixiPoint } from 'pixi-svelte';

	export type ForgeTone = 'steel' | 'fire' | 'green' | 'orange' | 'red';

	export type ForgeButtonProps = {
		label?: string;
		width: number;
		height: number;
		/** colour family */
		tone?: ForgeTone;
		/** the dominant action (DROP): bigger label + an ember glow */
		primary?: boolean;
		/** force the glow on/off (defaults to `primary`) */
		glow?: boolean;
		/** toggled-on state (turbo engaged, auto-spin running, selected risk) */
		active?: boolean;
		disabled?: boolean;
		onpress: () => void;
		x?: number;
		y?: number;
		/** anchor for (x,y) — defaults to centre so the bar lays out by centre points */
		anchor?: PixiPoint;
		/** label font size override (defaults to a ratio of height) */
		fontSize?: number;
		children?: Snippet;
	};

	// Forge / ember palettes. `steel` = the neutral dark-metal + gold-accent control;
	// `fire` = the DROP hero (molten orange); green/orange/red carry the risk level.
	const GOLD = 0xf5d042;
	const GOLD_BRIGHT = 0xffd34d;
	const PALETTES: Record<
		ForgeTone,
		{
			fill: number;
			hover: number;
			press: number;
			border: number;
			borderHi: number;
			text: number;
			textHi: number;
			glow: number;
			alpha: number;
		}
	> = {
		steel: { fill: 0x1a2030, hover: 0x232c3e, press: 0x10151f, border: 0x3a4252, borderHi: GOLD, text: 0xc7cedb, textHi: GOLD_BRIGHT, glow: GOLD_BRIGHT, alpha: 0.92 },
		fire: { fill: 0xe2500e, hover: 0xff6116, press: 0xc2430b, border: 0xffc24d, borderHi: 0xffe08a, text: 0xfff4e0, textHi: 0xffffff, glow: 0xff5a14, alpha: 1 },
		green: { fill: 0x16432a, hover: 0x1c5536, press: 0x103420, border: 0x3fbf6a, borderHi: 0x6fe89a, text: 0xb6f0c8, textHi: 0xe2fff0, glow: 0x3fbf6a, alpha: 1 },
		orange: { fill: 0x7a3f0a, hover: 0x934c0c, press: 0x633308, border: 0xf5a042, borderHi: 0xffc46a, text: 0xffdcab, textHi: 0xffeccb, glow: 0xf5a042, alpha: 1 },
		red: { fill: 0x6a1c19, hover: 0x82221e, press: 0x551714, border: 0xe0524f, borderHi: 0xff8078, text: 0xffbab2, textHi: 0xffdcd6, glow: 0xe0524f, alpha: 1 },
	};
</script>

<script lang="ts">
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { Button } from 'components-pixi';

	const {
		label,
		width,
		height,
		tone = 'steel',
		primary = false,
		glow,
		active = false,
		disabled = false,
		onpress,
		x = 0,
		y = 0,
		anchor = 0.5,
		fontSize,
		children,
	}: ForgeButtonProps = $props();

	const showGlow = $derived((glow ?? primary) && !disabled);
	const radius = $derived(Math.min(width, height) * 0.22);
	const labelSize = $derived(fontSize ?? height * (primary ? 0.32 : 0.3));

	const skin = (hovered: boolean, pressed: boolean) => {
		if (disabled)
			return { fill: 0x141821, fillAlpha: 0.6, border: 0x2a3140, borderWidth: 1.5, text: 0x5a6172 };
		const p = PALETTES[tone];
		const hi = hovered || active;
		return {
			fill: pressed ? p.press : hovered ? p.hover : p.fill,
			fillAlpha: p.alpha,
			border: hi ? p.borderHi : p.border,
			borderWidth: primary ? 3.5 : active ? 2.5 : hi ? 2 : 1.5,
			text: hi ? p.textHi : p.text,
		};
	};
	const glowColor = $derived(PALETTES[tone].glow);
</script>

<Button sizes={{ width, height }} {onpress} {disabled} {x} {y} {anchor}>
	{#snippet children({ center, hovered, pressed })}
		{@const s = skin(hovered, pressed)}
		<!-- glow behind the primary / hot buttons (two layers for the fire hero) -->
		{#if showGlow}
			<Rectangle x={center.x} y={center.y} anchor={0.5} width={width + 28} height={height + 28} borderRadius={radius + 12} backgroundColor={glowColor} backgroundAlpha={hovered ? 0.22 : 0.12} />
			<Rectangle x={center.x} y={center.y} anchor={0.5} width={width + 12} height={height + 12} borderRadius={radius + 6} backgroundColor={glowColor} backgroundAlpha={hovered ? 0.34 : 0.22} />
		{/if}

		<Rectangle x={center.x} y={center.y} anchor={0.5} {width} {height} borderRadius={radius} backgroundColor={s.fill} backgroundAlpha={s.fillAlpha} borderColor={s.border} borderWidth={s.borderWidth} />

		{#if label}
			<Text
				x={center.x}
				y={center.y}
				anchor={0.5}
				text={label}
				style={{
					align: 'center',
					fontFamily: 'proxima-nova',
					fontWeight: primary ? '800' : '700',
					fontSize: labelSize,
					letterSpacing: primary ? 2 : 1,
					fill: s.text,
				}}
			/>
		{/if}

		{#if children}
			<Container x={center.x} y={center.y}>
				{@render children()}
			</Container>
		{/if}
	{/snippet}
</Button>
