<script lang="ts">
	import { Rectangle } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
</script>

<!-- Plain dark full-canvas backdrop behind the board. The chassis art (bg.png)
     carries the scene; this just fills the letterboxed margins on wide/tall screens. -->
<Rectangle
	{...context.stateLayoutDerived.canvasSizes()}
	backgroundColor={0x0a0d12}
	zIndex={-3}
/>
