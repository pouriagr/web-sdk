import type { BetType } from 'rgs-requests';

// Power Plinko book events — must match the math output in
// math-sdk/games/0_0_powerplinko (see games-spec/0_0_powerplinko.md).
// A round is: one `wheel` throw, then `setTotalWin`, then `finalWin`.

// The custom wheel-throw event. `distance` is 0 (centre) .. 1 (outer edge);
// `multiplier` is the landed win multiplier. Amounts elsewhere are in cents.
type BookEventWheel = {
	index: number;
	type: 'wheel';
	band: number;
	totalBands: number;
	distance: number;
	multiplier: number;
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number; // cents (multiplier * 100)
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number; // cents (multiplier * 100)
};

// Kept only so the shared resume/snapshot helper in utils.ts stays well-typed;
// not emitted during a normal round.
type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent =
	| BookEventWheel
	| BookEventSetTotalWin
	| BookEventFinalWin
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
