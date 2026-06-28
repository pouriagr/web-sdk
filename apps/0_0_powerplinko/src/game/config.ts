// INERT scaffolding from the number-picker template. NOT read at runtime and NOT
// published — kept only because src/game/types.ts derives dead template types from its
// `symbols`/`betModes`/`paddingReels` shape. The real game identity lives in package.json
// ("name"), the math configs, and the launch env. Identity scalars corrected for hygiene.
export default {
	providerName: 'sample_provider',
	gameName: 'power_plinko',
	gameID: '0_0_powerplinko',
	rtp: 0.96,
	numReels: 5,
	numRows: [3, 3, 3, 3, 3],
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.97,
			max_win: 5000,
		},
		bonus: {
			cost: 100.0,
			feature: false,
			buyBonus: true,
			rtp: 0.97,
			max_win: 5000,
		},
	},
	symbols: {
		W: {
			paytable: null,
			special_properties: ['wild'],
		},
		H4: {
			paytable: [
				{
					'5': 3,
				},
				{
					'4': 1,
				},
				{
					'3': 0.5,
				},
			],
		},
		H5: {
			paytable: [
				{
					'5': 2,
				},
				{
					'4': 0.8,
				},
				{
					'3': 0.4,
				},
			],
		},
		S: {
			paytable: null,
			special_properties: ['scatter'],
		},
		L1: {
			paytable: [
				{
					'5': 2,
				},
				{
					'4': 0.8,
				},
				{
					'3': 0.4,
				},
			],
		},
		L2: {
			paytable: [
				{
					'5': 1.5,
				},
				{
					'4': 0.5,
				},
				{
					'3': 0.2,
				},
			],
		},
		L3: {
			paytable: [
				{
					'5': 1.5,
				},
				{
					'4': 0.5,
				},
				{
					'3': 0.2,
				},
			],
		},
		L4: {
			paytable: [
				{
					'5': 1,
				},
				{
					'4': 0.3,
				},
				{
					'3': 0.1,
				},
			],
		},
		H3: {
			paytable: [
				{
					'5': 5,
				},
				{
					'4': 2,
				},
				{
					'3': 1,
				},
			],
		},
		H2: {
			paytable: [
				{
					'5': 8,
				},
				{
					'4': 4,
				},
				{
					'3': 2,
				},
			],
		},
		H1: {
			paytable: [
				{
					'5': 10,
				},
				{
					'4': 5,
				},
				{
					'3': 3,
				},
			],
		},
	},
	paddingReels: {
		basegame: '',
		freegame: '',
		superspingame: '',
	},
};
