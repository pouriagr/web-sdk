import { stateBet } from 'state-shared';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet } from './utils';

// Ember Rotor is a single-outcome wheel game — no reels/board to spin or settle, so
// the game-actor hooks are minimal: reset the win, request the bet, play the book
// (which drives the wheel/ball animation via the `wheel` event). The slot-style reel
// scaffolding the number-picker template carried is NOT used here.
const primaryMachines = createPrimaryMachines<Bet>({
	// Replay / active-resume: a round is atomic (wheel → setTotalWin → finalWin), so just
	// play the full recorded book — playBet animates the throw and settles the win. (No
	// bonus mid-round state to snapshot, so the template's convertTorResumableBet is N/A.)
	onResumeGameActive: (betToResume) => betToResume,
	onResumeGameInactive: () => {
		// Reconnect to an already-resolved round: balance is settled server-side and there
		// is no board state to restore, so nothing to render (round just returns to idle).
	},
	onNewGameStart: async () => {
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
	},
	onNewGameError: () => {},
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: () => false,
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
