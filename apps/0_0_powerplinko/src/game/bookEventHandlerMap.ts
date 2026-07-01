import { stateBet } from 'state-shared';
import { type BookEventHandlerMap } from 'utils-book';

import { eventEmitter } from './eventEmitter';
import { stateXstateDerived } from './stateXstate';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';

// Auto-play cadence: during auto we do NOT block the round on the full ball-flight animation —
// a new ball drops ~every 0.5s and earlier balls keep flying/fading in the background (they
// overlap; intended). This is INDEPENDENT of turbo — under turbo the flight is short, so a
// longer cadence would make each ball finish before the next drops (looks like "waiting");
// keeping this well under the flight time preserves the overlap in both modes. Manual drops
// still await the full flight so the win settles as the ball lands.
const AUTO_DROP_MS = 450;
const waitMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Translate Ember Rotor book events into emitter events that the board renders.
// MANUAL drop: awaiting the `wheel` throw paces the round to the ball-flight animation
// (the win settles as the ball lands). AUTO: fire the throw but don't wait (see AUTO_DROP_MS).
export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	wheel: async (bookEvent: BookEventOfType<'wheel'>) => {
		if (stateXstateDerived.isAutoBetting()) {
			// fire-and-forget the flight (don't block the round); swallow errors so a mid-flight
			// throw can't surface as an unhandled rejection.
			void eventEmitter.broadcastAsync({ type: 'wheelThrow', data: bookEvent }).catch(() => {});
			await waitMs(AUTO_DROP_MS);
		} else {
			await eventEmitter.broadcastAsync({ type: 'wheelThrow', data: bookEvent });
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		// Drives the standard win readout (LabelWin) via the shared bet state. Amount
		// is in book units (multiplier * 100); LabelWin normalises it against the
		// wagered bet (see utils-shared/amount.ts).
		stateBet.winBookEventAmount = bookEvent.amount;
		// Win chime: this handler runs AFTER the awaited `wheel` throw animation, so the
		// orb has already landed. Only chime on a genuine PROFIT — coefficient > 1, i.e.
		// amount > 100 (amount is cents = multiplier * 100). So 0×, 0.5×, 1× landings stay
		// silent; only >1× pays the chime. Played by Sound.svelte (HTMLAudio data URI).
		if (bookEvent.amount > 100) eventEmitter.broadcast({ type: 'soundWin' });
		eventEmitter.broadcast({ type: 'setTotalWin', data: bookEvent });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		await eventEmitter.broadcastAsync({ type: 'finalWin', data: bookEvent });
	},
};
