import type { BookEventOfType } from './typesBookEvent';

// Emitter events specific to Power Plinko. The book-event handlers
// (bookEventHandlerMap.ts) broadcast these; Game.svelte subscribes to them.
export type EmitterEventGame =
	| { type: 'wheelThrow'; data: BookEventOfType<'wheel'> }
	| { type: 'setTotalWin'; data: BookEventOfType<'setTotalWin'> }
	| { type: 'finalWin'; data: BookEventOfType<'finalWin'> };
