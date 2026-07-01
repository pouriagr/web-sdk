// Cosmetic "last 10 results" history (re-added after the demo-wallet prototype was
// replaced by the RGS shell). This is purely a display nicety — the RGS does NOT feed
// round history; we just record each landed multiplier locally as the board animates a
// throw. Not used for any payout/compliance logic (Stake shows authoritative bet history
// at the platform level, outside the game iframe).
//
// Reactive across modules via a $state object whose property we reassign (same pattern as
// the SDK's stateLayout / stateBet).
const MAX = 10;

export const stateHistory = $state<{ items: { mult: number }[] }>({ items: [] });

/** Record a finished throw's multiplier (most recent first), capped at the last 10. */
export const pushResult = (mult: number) => {
	stateHistory.items = [{ mult }, ...stateHistory.items].slice(0, MAX);
};

export const clearHistory = () => {
	stateHistory.items = [];
};
