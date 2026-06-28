// Power Plinko risk modes. These MIRROR the math source of truth in
// math-sdk/games/0_0_powerplinko/game_config.py (distance_bands_by_mode):
// `multipliers[b]` is the payout for landing band b, `weights[b]` is that band's
// count out of 100,000 sims. Every mode is RTP 0.96 exactly; higher risk = more
// 0x landings + a fatter rare tail to the 5000x cap.
export type GameMode = {
	key: 'low' | 'medium' | 'high';
	label: string;
	multipliers: number[]; // length 9, band 0 (nearest) -> band 8 (farthest)
	weights: number[]; // length 9, sums to 100_000
};

export const GAME_MODES: GameMode[] = [
	{
		key: 'low',
		label: 'Low',
		multipliers: [0.5, 1.0, 1.2, 1.5, 2.0, 3.0, 6.0, 12.0, 25.0],
		weights: [46547, 26000, 13000, 6499, 5784, 1500, 520, 120, 30],
	},
	{
		key: 'medium',
		label: 'Medium',
		multipliers: [0, 0.5, 1.5, 3, 8, 25, 100, 500, 5000],
		weights: [55417, 24000, 12000, 6000, 2000, 480, 90, 12, 1],
	},
	{
		key: 'high',
		label: 'High',
		multipliers: [0, 0, 0.5, 2, 6, 30, 200, 1000, 5000],
		weights: [57654, 22000, 11000, 6250, 2500, 500, 80, 12, 4],
	},
];

export const TOTAL_BANDS = 9;
export const DEFAULT_MODE: GameMode['key'] = 'medium';

export const getMode = (key: string): GameMode =>
	GAME_MODES.find((m) => m.key === key) ?? GAME_MODES[1];

// Format a multiplier for a bucket label: 0 -> "0x", 1 -> "1x", 0.5 -> "0.5x".
export const fmtMult = (m: number): string => `${m}x`;
