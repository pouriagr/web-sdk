// Register Ember Rotor's risk modes (low/medium/high) as bet modes.
//
// Why this exists: `stateMeta.betModeMeta` is NOT populated from the RGS — it
// defaults to the hard-coded DEFAULT_BET_MODE_META (BASE/ANTE/BONUS/…) in
// state-shared. Our math publishes three sibling modes (low/medium/high, all
// cost 1.0; see math-sdk/games/0_0_powerplinko publish_files/index.json), so the
// frontend must register matching meta itself, otherwise:
//   - stateBetDerived.activeBetMode() returns null for our keys, and
//     betCostMultiplier() reads `.type` on it → throws (breaks ButtonBet),
//   - requestBet would send mode 'BASE', which the RGS rejects (no such mode).
//
// All three modes are `type: 'default'` (cost 1.0): default modes are hidden from
// the Buy-Bonus modal — the player picks risk via our own on-board selector,
// which sets stateBet.activeBetModeKey directly.
import { stateBet, stateMeta, type BetModeData } from 'state-shared';

import { GAME_MODES, DEFAULT_MODE, fmtMult } from './modes';

const makeBetModeData = (mode: string, title: string, maxWin: number): BetModeData => ({
	mode,
	costMultiplier: 1.0,
	type: 'default',
	parent: '',
	children: '',
	assets: { icon: '', volatility: '', button: '', dialogImage: '', dialogVolatility: '' },
	text: {
		title,
		description: `Max win ${fmtMult(maxWin)}`,
		dialog: '',
		button: '',
		tickerIdle: '',
		tickerSpin: '',
	},
	maxWin,
});

const VALID_MODE_KEYS = new Set(GAME_MODES.map((m) => m.key));

// Run once at app init (called from setContext, before any UI renders).
export const initBetModes = () => {
	stateMeta.betModeMeta = Object.fromEntries(
		GAME_MODES.map((m) => {
			const topMultiplier = m.multipliers[m.multipliers.length - 1];
			// key by the exact mode name the RGS/math use (low/medium/high); activeBetMode()
			// resolves it via its lower-case fallback lookup.
			return [m.key, makeBetModeData(m.key, m.label, topMultiplier)];
		}),
	);

	// The global default activeBetModeKey is 'BASE', which this game has no table
	// for. Normalise to a real mode unless the RGS already resumed a valid one.
	if (!VALID_MODE_KEYS.has(stateBet.activeBetModeKey as (typeof GAME_MODES)[number]['key'])) {
		stateBet.activeBetModeKey = DEFAULT_MODE;
	}
};
