<script lang="ts">
	import { onMount } from 'svelte';

	import { Text } from 'pixi-svelte';
	import { stateBet, stateConfig } from 'state-shared';

	import { gameActor } from '../game/actor';
	import { getContext } from '../game/context';

	type Props = {
		debug?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	// Enforce the jurisdiction flags the platform sends in stateConfig.jurisdiction. The
	// standard shell does NOT consume these, and fully HIDING the Turbo/AutoSpin buttons
	// would mean forking the shell chrome (against this game's "use the standard shell"
	// decision) — so we enforce the BEHAVIOUR here (the part compliance actually tests):
	// turbo can never engage and auto-play can never start. Button-hiding + a clean
	// space-bar (disabledSpacebar) gate are SDK-level gaps — see the launch TODO.
	$effect(() => {
		if (stateConfig.jurisdiction.disabledTurbo && stateBet.isTurbo) {
			stateBet.isTurbo = false;
		}
	});
	$effect(() => {
		if (stateConfig.jurisdiction.disabledAutoplay && stateBet.autoSpinsCounter !== 0) {
			stateBet.autoSpinsCounter = 0;
		}
	});

	onMount(() => {
		const { unsubscribe } = gameActor.subscribe((snapshot) => {
			context.stateXstate.value = snapshot.value;
			// const childActor = snapshot.children[snapshot.value];
		});

		gameActor.start();
		gameActor.send({ type: 'RENDERED' });

		return () => {
			// Equivalent to onDestroy(); Leave this comment for searching.
			unsubscribe();
			gameActor.stop();
		};
	});

	context.eventEmitter.subscribeOnMount({
		// Connect every actor with app.eventEmitter to avoid call actor directly
		bet: () => gameActor.send({ type: 'BET' }),
		// Honour disabledAutoplay: drop the auto-bet start so an auto-play run never begins.
		autoBet: () => {
			if (stateConfig.jurisdiction.disabledAutoplay) return;
			gameActor.send({ type: 'AUTO_BET' });
		},
		resumeBet: () => gameActor.send({ type: 'RESUME_BET' }),
	});
</script>

{#if props.debug}
	<Text
		x={context.stateLayoutDerived.canvasSizes().width}
		anchor={{ x: 1, y: 0 }}
		style={{ fill: 0xffffff }}
		text={JSON.stringify(context.stateXstate.value, undefined, 2)}
	/>
{/if}
