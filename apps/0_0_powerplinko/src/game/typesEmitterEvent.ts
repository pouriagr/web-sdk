import type { BookEventOfType } from './typesBookEvent';

// Emitter events specific to Ember Rotor. The book-event handlers
// (bookEventHandlerMap.ts) broadcast these; Game.svelte subscribes to them.
export type EmitterEventGame =
	| { type: 'wheelThrow'; data: BookEventOfType<'wheel'> }
	| { type: 'setTotalWin'; data: BookEventOfType<'setTotalWin'> }
	| { type: 'finalWin'; data: BookEventOfType<'finalWin'> }
	// Dedicated win-chime trigger. Kept separate from the generic `soundOnce` (which the
	// vestigial slot scaffolding broadcasts) so the chime only ever fires on a real win.
	| { type: 'soundWin' };
