<script lang="ts">
	// Ember Rotor's OWN branded loading screen — replaces the SDK's generic `LoaderExample`
	// ("Add Your Loader" placeholder). Shown AFTER the mandatory Stake Engine loader
	// (`LoaderStakeEngine`), while the Pixi board assets finish preloading. Self-contained:
	// spins the real rune-rotor art over a forge-dark backdrop with the wordmark — no new asset.
	// Mirrors LoaderBase's behaviour (show, then fade out + oncomplete after a timeout).
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	type Props = { oncomplete?: () => void };
	const props: Props = $props();

	// Small, loader-only rotor (~48KB webp, downscaled from the 1.6MB in-game rotor.png so the
	// loader doesn't visibly half-download). The full-res game rotor.png is left untouched.
	// Sub-path-safe: '../../art/rotor-loader.webp' does NOT resolve to a build-time file (the real
	// file is static/art/rotor-loader.webp, served at <base>/art/), so Vite keeps it a runtime
	// import.meta.url URL that resolves relative to the bundle (see src/game/assets.ts).
	const rotorUrl = new URL('../../art/rotor-loader.webp', import.meta.url).href;

	let loading = $state(true);

	onMount(async () => {
		await waitForTimeout(1800);
		loading = false;
		props.oncomplete?.();
	});
</script>

{#if loading}
	<div class="loader" transition:fade>
		<img class="rotor" src={rotorUrl} alt="" />
		<div class="title">EMBER ROTOR</div>
		<div class="sub">LOADING…</div>
	</div>
{/if}

<style lang="scss">
	.loader {
		position: absolute;
		inset: 0;
		z-index: 999;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.4rem;
		background: radial-gradient(circle at 50% 42%, #141a24 0%, #0a0d12 72%);
		overflow: hidden;
	}
	.rotor {
		width: min(38vw, 230px);
		height: auto;
		animation: spin 6s linear infinite;
		filter: drop-shadow(0 0 26px rgba(255, 122, 26, 0.55));
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.title {
		font-family: 'proxima-nova', sans-serif;
		font-weight: 800;
		letter-spacing: 0.14em;
		font-size: clamp(1.4rem, 4vw, 2.4rem);
		color: #ffd34d;
		text-shadow: 0 0 18px rgba(255, 122, 26, 0.6);
	}
	.sub {
		font-family: 'proxima-nova', sans-serif;
		color: #8a93a6;
		letter-spacing: 0.24em;
		font-size: 0.8rem;
		animation: pulse 1.4s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}
</style>
