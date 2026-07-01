<script lang="ts">
	// Ember Rotor's custom, on-theme control bar (replaces the stock UIDefault for the
	// `default` UI mode). It REUSES the SDK's tiny control ACTIONS + state (verified in
	// components-ui-pixi/src/components/Button*.svelte), but renders everything through our
	// themed ForgeButton so the bar matches the forge/ember art. Layout per user feedback:
	//   - no WIN label; BALANCE / BET are plain text (no black tiled background)
	//   - the bet stepper is  −  BET  +  (minus left, plus right of the amount)
	//   - RISK MODE is a single Menu-style button, coloured by level (green→orange→red),
	//     that opens a small popup to pick Low / Medium / High
	//   - DROP is the fiery hero; every other text button shares one size
	import { EnableSpaceHold } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { BLACK } from 'constants-shared/colors';
	import {
		stateUi,
		stateBet,
		stateBetDerived,
		stateConfig,
		stateModal,
		stateSound,
		stateUrlDerived,
	} from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { i18nDerived } from 'components-ui-pixi/src/i18n/i18nDerived';

	import ForgeButton, { type ForgeTone } from './ForgeButton.svelte';
	import ButtonDrop from './ButtonDrop.svelte';
	import { getContext } from '../game/context';
	import { GAME_MODES, getMode } from '../game/modes';

	const context = getContext();
	// Stake.US social: restricted words (bet/stake/pay/cost/…) are swapped for approved
	// alternatives. social() is URL-based (stable per session).
	const social = stateUrlDerived.social();
	const L = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const stacked = $derived(context.stateLayoutDerived.isStacked());
	const cx = $derived(L.width / 2);

	// one shared size for every secondary TEXT button (RISK / AUTO / TURBO / MENU)
	const SW = 160;
	const SH = 96;
	// the bet stepper +/- are smaller, leaving the BET amount more room for big numbers
	const STW = 104;
	const STH = 88;

	// --- shared bits of state (mirrors the SDK button components) ---
	const idle = $derived(context.stateXstateDerived.isIdle());
	const smallestBet = $derived(stateConfig.betAmountOptions[0]);
	const biggestBet = $derived(
		stateConfig.betAmountOptions[stateConfig.betAmountOptions.length - 1],
	);
	const decDisabled = $derived(!idle || stateBet.betAmount === smallestBet);
	const incDisabled = $derived(!idle || stateBet.betAmount === biggestBet);
	const autoActive = $derived(stateBetDerived.hasAutoBetCounter());
	const autoDisabled = $derived(
		stateBet.isSpaceHold || (!idle && !autoActive) || !stateBetDerived.isBetCostAvailable(),
	);
	const autoLabel = $derived(
		autoActive
			? stateBet.autoSpinsCounter === Infinity
				? '∞'
				: String(stateBet.autoSpinsCounter)
			: 'AUTO',
	);
	const turboActive = $derived(stateBet.isTurbo);
	const turboDisabled = $derived(stateBet.isSpaceHold);
	const soundOn = $derived(stateSound.volumeValueMaster > 0);

	const betStr = $derived(numberToCurrencyString(stateBetDerived.betCost()));

	// --- risk mode (single coloured Menu-style button + popup) ---
	let riskOpen = $state(false);
	const activeMode = $derived(getMode(stateBet.activeBetModeKey));
	const riskToneByKey: Record<string, ForgeTone> = { low: 'green', medium: 'orange', high: 'red' };
	const riskTone = $derived(riskToneByKey[activeMode.key] ?? 'orange');
	const riskX = $derived(stacked ? 180 : 175);
	const riskY = $derived(stacked ? L.height - 470 : L.height - 96);

	// --- actions (each identical to the matching SDK Button*.svelte) ---
	const ping = () => context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
	const stepBet = (dir: 1 | -1) => {
		ping();
		const sorted = [...stateConfig.betAmountOptions].sort((a, b) => (dir > 0 ? a - b : b - a));
		const next = sorted.find((o) => (dir > 0 ? o > stateBet.betAmount : o < stateBet.betAmount));
		stateBetDerived.setBetAmount(next ?? (dir > 0 ? biggestBet : smallestBet));
	};
	const onMenu = () => {
		ping();
		stateUi.menuOpen = true;
	};
	const onAuto = () => {
		ping();
		if (autoActive) stateBet.autoSpinsCounter = 0;
		else stateModal.modal = { name: 'autoSpin' };
	};
	const onTurbo = () => {
		ping();
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};
	const onRisk = () => {
		ping();
		riskOpen = !riskOpen;
	};
	const selectRisk = (key: string) => {
		ping();
		if (idle) stateBet.activeBetModeKey = key;
		riskOpen = false;
	};
	const onPayTable = () => {
		ping();
		stateModal.modal = { name: 'payTable' };
	};
	const onGameRules = () => {
		ping();
		stateModal.modal = { name: 'gameRules' };
	};
	const onSound = () => {
		ping();
		stateSound.volumeValueMaster = stateSound.volumeValueMaster === 0 ? 50 : 0;
	};
	const onClose = () => {
		ping();
		stateUi.menuOpen = false;
	};

	const menuItems = $derived([
		{ label: social ? 'MULTIPLIERS' : 'PAY TABLE', onpress: () => onPayTable(), active: false },
		{ label: 'GAME RULES', onpress: () => onGameRules(), active: false },
		{ label: soundOn ? 'SOUND ON' : 'SOUND OFF', onpress: () => onSound(), active: soundOn },
	]);

	// Preserve the SDK turbo behaviour: turbo auto-engages while the round is being stopped.
	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});
</script>

<!-- plain two-line money label (no background) -->
{#snippet moneyLabel(caption: string, value: string, lx: number, ly: number)}
	<Text x={lx} y={ly - 15} anchor={0.5} text={caption} style={{ fontFamily: 'proxima-nova', fontWeight: '700', fontSize: 17, letterSpacing: 1, fill: 0x8a93a6 }} />
	<Text x={lx} y={ly + 14} anchor={0.5} text={value} style={{ fontFamily: 'proxima-nova', fontWeight: '700', fontSize: 33, fill: 0xffffff }} />
{/snippet}

<EnableSpaceHold />

<!-- ===== main control bar (pinned to the canvas bottom in the standard layout space) ===== -->
<MainContainer standard alignVertical="bottom">
	{#if !stacked}
		<!-- WIDE (desktop / landscape) -->
		<ForgeButton x={riskX} y={riskY} width={SW} height={SH} tone={riskTone} active label="RISK" onpress={onRisk} />

		<ForgeButton x={447} y={riskY} width={75} height={63} label="−" fontSize={35} disabled={decDisabled} onpress={() => stepBet(-1)} />
		{@render moneyLabel(i18nDerived.bet(), betStr, 570, riskY)}
		<ForgeButton x={695} y={riskY} width={75} height={63} label="+" fontSize={32} disabled={incDisabled} onpress={() => stepBet(1)} />

		<ButtonDrop x={cx} y={riskY} width={320} height={132} />

		<ForgeButton x={1250} y={riskY} width={SW} height={SH} label={autoLabel} active={autoActive} disabled={autoDisabled} onpress={onAuto} />
		<ForgeButton x={1420} y={riskY} width={SW} height={SH} label="TURBO" active={turboActive} disabled={turboDisabled} onpress={onTurbo} />
		<ForgeButton x={1590} y={riskY} width={SW} height={SH} label="MENU" onpress={onMenu} />
	{:else}
		<!-- STACKED (portrait / tablet): rows from the bottom up -->
		<ForgeButton x={riskX} y={riskY} width={SW} height={SH} tone={riskTone} active label="RISK" onpress={onRisk} />
		<ForgeButton x={380} y={riskY} width={SW} height={SH} label={autoLabel} active={autoActive} disabled={autoDisabled} onpress={onAuto} />
		<ForgeButton x={580} y={riskY} width={SW} height={SH} label="TURBO" active={turboActive} disabled={turboDisabled} onpress={onTurbo} />
		<ForgeButton x={780} y={riskY} width={SW} height={SH} label="MENU" onpress={onMenu} />

		<ForgeButton x={220} y={L.height - 320} width={STW} height={STH} label="−" fontSize={48} disabled={decDisabled} onpress={() => stepBet(-1)} />
		{@render moneyLabel(i18nDerived.bet(), betStr, cx, L.height - 320)}
		<ForgeButton x={860} y={L.height - 320} width={STW} height={STH} label="+" fontSize={44} disabled={incDisabled} onpress={() => stepBet(1)} />

		<ButtonDrop x={cx} y={L.height - 150} width={420} height={156} />
	{/if}
</MainContainer>

<!-- ===== RISK popup (Menu-style): pick Low / Medium / High above the RISK button ===== -->
{#if riskOpen}
	<Rectangle eventMode="static" cursor="pointer" alpha={0.4} anchor={0.5} backgroundColor={BLACK} width={canvas.width} height={canvas.height} x={canvas.width * 0.5} y={canvas.height * 0.5} onpointerup={() => (riskOpen = false)} />
	<MainContainer standard alignVertical="bottom">
		{#each GAME_MODES as m, i (m.key)}
			<ForgeButton
				x={riskX}
				y={riskY - (i + 1) * 104}
				width={SW}
				height={SH}
				tone={riskToneByKey[m.key]}
				active={stateBet.activeBetModeKey === m.key}
				label={m.label.toUpperCase()}
				onpress={() => selectRisk(m.key)}
			/>
		{/each}
	</MainContainer>
{/if}

<!-- ===== MENU overlay (dim + themed column) ===== -->
{#if stateUi.menuOpen}
	<Rectangle eventMode="static" cursor="pointer" alpha={0.6} anchor={0.5} backgroundColor={BLACK} width={canvas.width} height={canvas.height} x={canvas.width * 0.5} y={canvas.height * 0.5} onpointerup={onClose} />
	<MainContainer standard alignVertical="center">
		{#each menuItems as it, i (it.label + i)}
			<ForgeButton x={cx} y={L.height / 2 - 200 + i * 96} width={320} height={80} label={it.label} active={it.active} onpress={it.onpress} />
		{/each}
	</MainContainer>
{/if}
