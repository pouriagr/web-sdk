<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const sizes = $derived(context.stateLayoutDerived.canvasSizes());

	// The board reserves the bottom ~22% of the canvas (see stateLayout WIDE); the framework
	// bet bar renders there. This forge tray (static/art/panel.png) is the background it sits
	// on so the controls don't float on the board. Rendered between the board and <UI> so it
	// sits behind the bet bar. Stretched to full width, bottom-aligned; the panel's glowing
	// top trim lands just above the bet-bar labels. The art's top ~28% is transparent.
	const ASPECT = 2448 / 432; // panel.png native aspect
	const panelHeight = $derived(Math.max(sizes.width / ASPECT, sizes.height * 0.3));
	const panelY = $derived(sizes.height - panelHeight);
</script>

<Sprite key="panel" x={0} y={panelY} width={sizes.width} height={panelHeight} />
