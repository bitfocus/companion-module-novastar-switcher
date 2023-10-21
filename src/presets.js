import { combineRgb } from '@companion-module/base'

let presetNum = 128

const basicPresets = {
	take: {
		type: 'button',
		category: 'Basics',
		name: 'TAKE',
		style: {
			text: 'TAKE',
			size: '24',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'take',
						options: {},
					},
				],
			},
		],
		feedbacks: [],
	},
	cut: {
		type: 'button',
		category: 'Basics',
		name: 'CUT',
		style: {
			text: 'CUT',
			size: '24',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'cut',
						options: {},
					},
				],
			},
		],
		feedbacks: [],
	},
}

const displayPresets = {
	ftb: {
		type: 'button',
		category: 'Display',
		name: 'Toggle FTB',
		style: {
			text: 'Toggle FTB',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'ftb',
						options: {
							ftb: '1',
						},
					},
				],
			},
			{
				down: [
					{
						actionId: 'ftb',
						options: {
							ftb: '0',
						},
					},
				],
			},
		],
		feedbacks: [],
	},
	freeze: {
		type: 'button',
		category: 'Display',
		name: 'Toggle Freeze',
		style: {
			text: 'Toggle Freeze',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'freeze',
						options: {
							freeze: '1',
						},
					},
				],
			},
			{
				down: [
					{
						actionId: 'freeze',
						options: {
							freeze: '0',
						},
					},
				],
			},
		],
		feedbacks: [],
	},
}

const customPlayPresets = {
	'preset-play': {
		type: 'button',
		category: 'Presets',
		name: 'Preset',
		style: {
			text: 'Preset',
			size: '18',
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(255, 0, 255),
		},
		steps: [
			{
				down: [
					{
						actionId: 'preset',
						options: {
							preset: 0,
						},
					},
				],
			},
		],
		feedbacks: [],
	},
}

const getPresets = (num) => {
	const playPresets = {}
	for (let i = 1; i <= num; i++) {
		const preset = {
			type: 'button',
			category: 'Presets',
			name: 'Preset ' + i,
			style: {
				text: 'Preset\\n' + i,
				size: '18',
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 255, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'preset',
							options: {
								preset: i,
							},
						},
					],
				},
			],
			feedbacks: [],
		}
		playPresets['preset-play' + i] = preset
	}
	return playPresets
}

export const getPresetDefinitions = function (instance) {
	presetNum = [instance.DEVICES_INFO.q8.id, instance.DEVICES_INFO.d32.id].includes(instance.config.modelId) ? 1024 : 128
	const playPresets = getPresets(presetNum)

	return {
		...basicPresets,
		...displayPresets,
		// ...customPlayPresets,
		...playPresets,
	}
}
