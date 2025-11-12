import { combineRgb } from '@companion-module/base'
import { isHttpDevice, isHttpDeviceWithDQ } from '../utils/index.js'
import {
	PRESET_KEYFRAME_STATUES,
	PRESET_TAKE_STATUES,
	SWAP_STATUES,
	NAME,
	FTB_STATUES,
	FREEZE_STATUES,
	CMD_DEVICES,
	DEVICE_PRESETS,
} from '../utils/constant.js'

const displayPresets = {
	take: {
		type: 'button',
		category: 'Display',
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
		category: 'Display',
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
	ftb: {
		type: 'button',
		category: 'Display',
		name: 'FTB',
		style: {
			text: 'FTB',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
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
		feedbacks: [
			{
				feedbackId: 'ftb',
				style: {
					bgcolor: combineRgb(255, 0, 0),
				},
				options: {},
			},
		],
	},
	freeze: {
		type: 'button',
		category: 'Display',
		name: 'Freeze',
		style: {
			text: 'Freeze',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
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
		feedbacks: [
			{
				feedbackId: 'freeze',
				style: {
					bgcolor: combineRgb(255, 0, 0),
				},
				options: {},
			},
		],
	},
}

// presetType: 2: PGM, 4: PVW (http)
const httpPresetType = {
	type: 'button',
	category: 'Display',
	name: 'presetType',
	style: {
		text: `Load to\n$(${NAME}:loadPresetAttrInfo)`,
		size: 'auto',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'presetType',
					options: {
						presetType: 'pvw',
					},
				},
			],
		},
		{
			down: [
				{
					actionId: 'presetType',
					options: {
						presetType: 'pgm',
					},
				},
			],
		},
		{
			down: [
				{
					actionId: 'presetType',
					options: {
						presetType: 'pgmTake',
					},
				},
			],
		},
		{
			down: [
				{
					actionId: 'presetType',
					options: {
						presetType: 'pgmTakeKeyFrame',
					},
				},
			],
		},
	],
	feedbacks: [
		{
			feedbackId: 'pgm',
			style: {
				bgcolor: combineRgb(255, 0, 0),
			},
			options: {},
		},
	],
}

// presetType: 1: PGM, 0: PVW (cmd)
const cmdPresetType = {
	type: 'button',
	category: 'Display',
	name: 'presetType',
	style: {
		text: 'Load to\nPVW',
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'presetType',
					options: {
						presetType: 'pgm',
					},
				},
			],
		},
		{
			down: [
				{
					actionId: 'presetType',
					options: {
						presetType: 'pvw',
					},
				},
			],
		},
	],
	feedbacks: [
		{
			feedbackId: 'pgm',
			style: {
				bgcolor: combineRgb(255, 0, 0),
				text: 'Load to\nPGM',
			},
			options: {},
		},
	],
}

const matchPgm = {
	type: 'button',
	category: 'Display',
	name: 'MatchPGM',
	style: {
		text: 'Match\nPGM',
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'matchPgm',
					options: {},
				},
			],
		},
	],
	feedbacks: [],
}

const swapCopy = {
	type: 'button',
	name: 'SwapCopy',
	category: 'Display',
	previewStyle: {
		text: 'Swap\nCopy',
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	style: {
		text: `$(${NAME}:swapStatus)`,
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'swapCopy',
					options: {
						swapCopy: SWAP_STATUES['copy'],
					},
				},
			],
		},
		{
			down: [
				{
					actionId: 'swapCopy',
					options: {
						swapCopy: SWAP_STATUES['swap'],
					},
				},
			],
		},
	],
	feedbacks: [
		{
			feedbackId: 'swapCopy',
			style: {
				bgcolor: combineRgb(255, 0, 0),
			},
			options: {},
		},
	],
}

// Take Time 旋钮
const takeTime = {
	type: 'button',
	category: 'Display',
	name: 'TakeTime',
	style: {
		text: 'Take\nTime',
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			rotate_left: [
				{
					actionId: 'takeTimeLeft',
					options: {
						direction: 'left',
					},
				},
			],
			rotate_right: [
				{
					actionId: 'takeTimeRight',
					options: {
						direction: 'right',
					},
				},
			],
		},
	],
	options: {
		rotaryActions: true,
	},
	feedbacks: [],
}

// Take Time Left
const takeTimeLeft = {
	type: 'button',
	category: 'Display',
	name: 'Take\nTime-',
	previewStyle: {
		text: `Time-\n$(${NAME}:time)s`,
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	style: {
		text: `Time-\n$(${NAME}:time)s`,
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'takeTimeLeft',
					options: {
						direction: 'left',
					},
				},
			],
		},
	],
}

// Take Time Right
const takeTimeRight = {
	type: 'button',
	category: 'Display',
	name: 'Take\nTime+',
	previewStyle: {
		text: `Time+\n$(${NAME}:time)s`,
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	style: {
		text: `Time+\n$(${NAME}:time)s`,
		size: '18',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'takeTimeRight',
					options: {
						direction: 'right',
					},
				},
			],
		},
	],
}

// 输出定位开关，按钮文本Mapping
const mapping = {
	type: 'button',
	name: 'Mapping',
	category: 'Display',
	style: {
		text: 'Mapping',
		size: '16',
		color: combineRgb(255, 255, 255),
		bgcolor: combineRgb(0, 0, 0),
	},
	steps: [
		{
			down: [
				{
					actionId: 'mapping',
					options: {
						mapping: '1', // 开启
					},
				},
			],
		},
		{
			down: [
				{
					actionId: 'mapping',
					options: {
						mapping: '0', // 关闭
					},
				},
			],
		},
	],
	feedbacks: [
		{
			feedbackId: 'mapping',
			style: {
				bgcolor: combineRgb(255, 0, 0),
			},
			options: {},
		},
	],
}

// 屏蔽 加载场景至pgm使用特效和kf
// const presetTake = {
// 	type: 'button',
// 	name: 'PresetTake',
// 	category: 'Display',
// 	style: {
// 		text: 'Preset+Take',
// 		size: 'auto',
// 		color: combineRgb(255, 255, 255),
// 		bgcolor: combineRgb(0, 0, 0),
// 	},
// 	steps: [
// 		{
// 			down: [
// 				{
// 					actionId: 'presetTakeAuto',
// 				},
// 			],
// 		},
// 	],
// 	feedbacks: [
// 		{
// 			feedbackId: 'presetTake',
// 			style: {
// 				bgcolor: combineRgb(10, 132, 255),
// 			},
// 			options: {},
// 		},
// 	],
// }

// const presetKeyFrame = {
// 	type: 'button',
// 	name: 'PresetKeyFrame',
// 	category: 'Display',
// 	style: {
// 		text: 'Preset + \nKeyFrame',
// 		size: '14',
// 		color: combineRgb(255, 255, 255),
// 		bgcolor: combineRgb(0, 0, 0),
// 	},
// 	steps: [
// 		{
// 			down: [
// 				{
// 					actionId: 'presetKeyFrameAuto',
// 				},
// 			],
// 		},
// 	],
// 	feedbacks: [
// 		{
// 			feedbackId: 'presetKeyFrame',
// 			style: {
// 				bgcolor: combineRgb(10, 132, 255),
// 			},
// 			options: {},
// 		},
// 	],
// }

// 指定屏幕基础操作
const generateSpecifiedScreenPresets = (instance, screenList) => {
	if (!screenList?.length) return {}

	const deafaultScreenId = Object.values(instance.presetDefinitionScreen)[0]?.screenId
	const specifiedScreenTake = {
		type: 'button',
		category: 'Quick Actions',
		name: 'Specified Screen TAKE',
		style: {
			text: `Specified Screen TAKE`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'specifiedScreenTake',
						options: {
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
		],
		feedbacks: [],
	}
	const specifiedScreenCut = {
		type: 'button',
		category: 'Quick Actions',
		name: 'Specified Screen CUT',
		style: {
			text: `Specified Screen CUT`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'specifiedScreenCut',
						options: {
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
		],
		feedbacks: [],
	}
	const specifiedScreenFtb = {
		type: 'button',
		category: 'Quick Actions',
		name: 'Specified Screen FTB',
		style: {
			text: `Specified Screen FTB`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'specifiedScreenFtb',
						options: {
							ftb: FTB_STATUES.enable,
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
			{
				down: [
					{
						actionId: 'specifiedScreenFtb',
						options: {
							ftb: FTB_STATUES.disable,
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
		],
		feedbacks: [
			{
				feedbackId: 'specified-screen-ftb',
				style: {
					bgcolor: combineRgb(255, 0, 0),
				},
			},
			{
				feedbackId: 'specified-screen-unftb',
				style: {
					bgcolor: combineRgb(255, 255, 255),
				},
			},
		],
	}
	const specifiedScreenFreeze = {
		type: 'button',
		category: 'Quick Actions',
		name: 'Specified Screen Freeze',
		style: {
			text: `Specified Screen Freeze`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'specifiedScreenFreeze',
						options: {
							freeze: FREEZE_STATUES.enable,
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
			{
				down: [
					{
						actionId: 'specifiedScreenFreeze',
						options: {
							freeze: FREEZE_STATUES.disable,
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
		],
		feedbacks: [
			{
				feedbackId: 'specified-screen-freeze',
				style: {
					bgcolor: combineRgb(255, 0, 0),
				},
			},
		],
	}
	const specifiedScreenMatchPgm = {
		type: 'button',
		category: 'Quick Actions',
		name: 'Specified Screen MatchPGM',
		style: {
			text: `Specified Screen MatchPGM`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'specifiedScreenMatchPgm',
						options: {
							screenIds: [deafaultScreenId],
						},
					},
				],
			},
		],
		feedbacks: [],
	}
	return {
		specifiedScreenTake,
		specifiedScreenCut,
		specifiedScreenFtb,
		specifiedScreenFreeze,
		specifiedScreenMatchPgm,
	}
}

// F系列场景
const getFseriesPresets = (num) => {
	const playPresets = {}
	for (let i = 1; i <= num; i++) {
		const preset = {
			type: 'button',
			category: 'Presets',
			name: 'Preset ' + i,
			style: {
				text: 'Preset \n' + i,
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

export const getPresetDefinitions = function (instance, screenList) {
	let basicPresets = {}
	if (isHttpDevice(instance)) {
		const specifiedScreenPresets = generateSpecifiedScreenPresets(instance, screenList)
		basicPresets = {
			...displayPresets,
			httpPresetType,
			swapCopy,
			matchPgm,
			takeTime,
			takeTimeLeft,
			takeTimeRight,
			// presetTake,
			// presetKeyFrame,
			...specifiedScreenPresets,
		}
		if (isHttpDeviceWithDQ(instance)) {
			basicPresets = { ...basicPresets, mapping }
		}
	} else {
		// F系列场景生成
		const presetNum = parseInt(DEVICE_PRESETS[instance.config.modelId]) ?? 128
		const fSeriesPresets = getFseriesPresets(presetNum)
		basicPresets = { ...displayPresets, cmdPresetType, ...fSeriesPresets }
	}

	return basicPresets
}
