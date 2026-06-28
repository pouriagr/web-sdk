import { type BookEventHandlerMap } from 'utils-book';

import { eventEmitter } from './eventEmitter';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';

// Translate Power Plinko book events into emitter events that Game.svelte renders.
// `broadcastAsync` waits for subscribers, so awaiting the `wheel` throw paces the
// round: the ball-flight animation finishes before the win is shown.
export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	wheel: async (bookEvent: BookEventOfType<'wheel'>) => {
		await eventEmitter.broadcastAsync({ type: 'wheelThrow', data: bookEvent });
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		eventEmitter.broadcast({ type: 'setTotalWin', data: bookEvent });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		await eventEmitter.broadcastAsync({ type: 'finalWin', data: bookEvent });
	},
};
