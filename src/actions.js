import {
	COMMON_PRESET_TYPE,
	HTTP_DEVICES,
	HTTP_Protocol_FTB,
	Central_Control_Protocol_FTB,
	HTTP_Protocol_FREEZE,
	Central_Control_Protocol_FREEZE,
	HTTP_Protocol_Swap_Copy,
	HTTP_Protocol_Output_Switch,
	PRESET_TAKE_STATUES,
	PRESET_KEYFRAME_STATUES,
	SWAP_STATUES,
	SELECT_STATUES,
	DIRECTION_TYPE,
	CMD_DEVICES,
	DEVICE_PRESETS,
	SCENE_TYPE,
	HTTP_PGM_PRESET_TYPE,
} from '../utils/constant.js'
import { cmdActions } from '../utils/cmdActions.js'
import { httpActions } from '../utils/httpActions.js'
import { isHttpDeviceWithDQ } from '../utils/index.js'

export const getActions = (instance) => {
	const modelId = instance.config.modelId
	const isHttpDevice = HTTP_DEVICES.includes(modelId)
	const actionsObj = isHttpDevice ? httpActions : cmdActions

	let actions = {}

	actions['take'] = {
		name: 'Execute Take on the selected screen',
		options: [],
		callback: async (event) => {
			try {
				actionsObj['take'].bind(instance)(event)
			} catch (error) {
				instance.log('error', 'take send error')
			}
		},
	}

	actions['cut'] = {
		name: 'Execute Cut on the selected screen',
		options: [],
		callback: async (event) => {
			try {
				actionsObj['cut'].bind(instance)(event)
			} catch (error) {
				instance.log('error', 'cut send error')
			}
		},
	}

	actions['ftb'] = {
		name: 'Execute FTB on the selected screen',
		options: [
			{
				type: 'dropdown',
				name: 'FTB',
				id: 'ftb',
				default: '1',
				choices: isHttpDevice ? HTTP_Protocol_FTB : Central_Control_Protocol_FTB,
			},
		],
		callback: async (event) => {
			try {
				actionsObj['ftb'].bind(instance)(event)
			} catch (error) {
				instance.log('error', 'FTB send error')
			}
		},
	}

	actions['freeze'] = {
		name: 'Execute Freeze on the selected screen ',
		options: [
			{
				type: 'dropdown',
				name: 'FRZ',
				id: 'freeze',
				default: '1',
				choices: isHttpDevice ? HTTP_Protocol_FREEZE : Central_Control_Protocol_FREEZE,
			},
		],
		callback: async (event) => {
			try {
				actionsObj['freeze'].bind(instance)(event)
			} catch (error) {
				instance.log('error', 'FRZ send error')
			}
		},
	}

	if (CMD_DEVICES.includes(modelId)) {
		actions['presetType'] = {
			name: 'Choose a destination to load the preset',
			options: [
				{
					type: 'dropdown',
					name: 'PVW/PGM',
					id: 'presetType',
					default: 'pvw',
					choices: COMMON_PRESET_TYPE,
				},
			],
			callback: async (event) => {
				try {
					actionsObj['presetType'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'presetType set error')
				}
			},
		}

		actions['preset'] = {
			name: 'Select a preset to load',
			options: [
				{
					type: 'dropdown',
					name: 'Preset',
					id: 'preset',
					default: 1,
					choices: [...Array(parseInt(DEVICE_PRESETS[modelId]) ?? 128)].map((_, index) => ({
						id: index + 1,
						label: `Preset ${index + 1}`,
					})),
				},
			],
			callback: async (event) => {
				try {
					actionsObj['preset'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'load_preset send error')
				}
			},
		}
	}

	if (isHttpDevice) {
		const presetDefinitionScreen = Object.values(instance.presetDefinitionScreen) ?? []

		actions['presetType'] = {
			name: 'Choose a destination to load the preset',
			options: [
				{
					type: 'dropdown',
					name: 'PVW/PGM',
					id: 'presetType',
					default: 'pvw',
					choices: COMMON_PRESET_TYPE.concat(HTTP_PGM_PRESET_TYPE),
				},
			],
			callback: async (event) => {
				try {
					actionsObj['presetType'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'presetType set error')
				}
			},
		}

		actions['preset'] = {
			name: 'Select a preset to load',
			options: [
				{
					type: 'dropdown',
					name: 'Preset',
					id: 'presetId',
					default: Object.values(instance.presetDefinitionPreset)[0]?.presetId,
					choices: Object.values(instance.presetDefinitionPreset).map((item) => ({
						id: item.presetId,
						label: item.name,
					})),
				},
			],
			callback: async (event) => {
				try {
					let obj = instance.presetDefinitionPreset[`preset-play${event.options.presetId}`]
					if (!obj) return

					let data = {
						options: {
							presetId: obj.presetId,
							i: obj.i,
							serial: obj.serial, // 添加 serial 参数
						},
					}
					actionsObj['preset'].bind(instance)(data)
				} catch (error) {
					instance.log('error', 'load_preset send error')
				}
			},
		}

		actions['screen'] = {
			name: 'Select/Deselect a screen',
			options: [
				{
					type: 'dropdown',
					name: 'Screen',
					id: 'screenId',
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
				{
					type: 'dropdown',
					name: 'ScreenSelect',
					id: 'select',
					default: SELECT_STATUES.disable,
					choices: [
						{ id: SELECT_STATUES.disable, label: 'Deselect the screen', default: SELECT_STATUES.disable },
						{ id: SELECT_STATUES.enable, label: 'Select the screen', default: SELECT_STATUES.enable },
					],
				},
			],
			callback: async (event) => {
				try {
					actionsObj['screen'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'screen send error')
				}
			},
		}

		// 变更屏幕的选中状态，与上方选中屏幕/取消选中不一致
		actions['changeScreen'] = {
			name: 'Select/Deselect a screen(auto)',
			options: [
				{
					type: 'dropdown',
					name: 'Screen',
					id: 'screenId',
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
			],
			callback: async (event) => {
				try {
					actionsObj['screen'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'changeScreen send error')
				}
			},
		}

		actions['layer'] = {
			name: 'Select/Deselect a layer',
			options: [
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'screenId',
					default: Object.values(instance.presetDefinitionScreen)[0]?.screenId,
					choices: Object.values(instance.presetDefinitionScreen).map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
				{
					type: 'dropdown',
					label: 'Scene Type',
					id: 'sceneType',
					default: SCENE_TYPE[0].id,
					choices: SCENE_TYPE,
				},
				{
					type: 'dropdown',
					label: 'Layer Index',
					id: 'layerIndex',
					default: 1,
					choices: Array.from({ length: 99 }, (_, i) => ({
						id: i + 1,
						label: `L${i + 1}`,
					})),
				},
				{
					type: 'dropdown',
					label: 'ScreenSelect',
					id: 'selected',
					default: '1',
					choices: [
						{ id: '0', label: 'Deselect the layer', default: '0' },
						{ id: '1', label: 'Select the layer', default: '1' },
					],
				},
			],
			callback: async (event) => {
				try {
					actionsObj['layer'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'load_layer send error')
				}
			},
		}

		// 变更图层的选中状态，与上方选中图层/取消选中不一致
		actions['deselectLayer'] = {
			name: 'Deselect Layer',
			options: [],
			callback: async (event) => {
				try {
					actionsObj['deselectLayer'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'deselectLayer error')
				}
			},
		}

		actions['source'] = {
			name: 'Change the source for the selected layer',
			options: [
				{
					type: 'dropdown',
					name: 'Source',
					id: 'sourceId',
					default: Object.values(instance.presetDefinitionSource)[0]?.sourceId,
					choices: Object.values(instance.presetDefinitionSource).map((item) => ({
						id: item.sourceId.toString(),
						label: item.name,
					})),
				},
			],
			callback: async (event) => {
				try {
					let [sourceType, sourceId] = event.options.sourceId.split('-')
					let obj = {
						options: {
							sourceId: Number(sourceId),
							sourceType: Number(sourceType),
						},
					}
					actionsObj['source'].bind(instance)(obj)
				} catch (error) {
					instance.log('error', 'load_source send error')
				}
			},
		}

		actions['swapCopy'] = {
			name: 'Swap between PGM and PVM/Copy PVW to PGM',
			options: [
				{
					type: 'dropdown',
					name: 'SwapCopy',
					id: 'swapCopy',
					default: SWAP_STATUES['swap'],
					choices: HTTP_Protocol_Swap_Copy,
				},
			],
			callback: async (event) => {
				try {
					actionsObj['swapCopy'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'SwapCopy send error')
				}
			},
		}

		actions['matchPgm'] = {
			name: 'Execute Match PGM on the selected screen',
			options: [],
			callback: async (event) => {
				try {
					actionsObj['matchPgm'].bind(instance)(event, DIRECTION_TYPE.matchPgm)
				} catch (error) {
					instance.log('error', 'MatchPGM send error')
				}
			},
		}

		actions['takeTimeRight'] = {
			name: 'Increase the transition duration of Take',
			options: [],
			callback: async (event) => {
				try {
					event.options.direction = 'right'
					actionsObj['takeTime'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'Take Time+ send error')
				}
			},
		}

		actions['takeTimeLeft'] = {
			name: 'Decrease the transition duration of Take',
			options: [],
			callback: async (event) => {
				try {
					event.options.direction = 'left'
					actionsObj['takeTime'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'Take Time- send error')
				}
			},
		}

		if (isHttpDeviceWithDQ(instance)) {
			actions['mapping'] = {
				name: 'Enable or disable output mapping',
				options: [
					{
						type: 'dropdown',
						name: 'mapping',
						id: 'mapping',
						default: '0',
						choices: HTTP_Protocol_Output_Switch,
					},
				],
				callback: async (event) => {
					try {
						actionsObj['mapping'].bind(instance)(event)
					} catch (error) {
						instance.log('error', 'Mapping send error')
					}
				},
			}
		}

		actions['presetTake'] = {
			name: 'Whether to execute Take when loading a preset to PGM',
			options: [
				{
					type: 'dropdown',
					name: 'PresetTake',
					label: 'Status',
					id: 'presetTake',
					default: instance.getVariableValue('presetTake'),
					choices: [
						{ id: PRESET_TAKE_STATUES['disable'], label: 'Off', default: PRESET_TAKE_STATUES['disable'] },
						{ id: PRESET_TAKE_STATUES['enable'], label: 'On', default: PRESET_TAKE_STATUES['enable'] },
					],
				},
			],
			callback: async (event) => {
				try {
					actionsObj['presetTake'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'PresetTake send error')
				}
			},
		}

		actions['presetKeyFrame'] = {
			name: 'Whether to execute KeyFrame when loading a preset to PGM',
			options: [
				{
					type: 'dropdown',
					label: 'Status',
					name: 'PresetKeyFrame',
					id: 'presetKeyFrame',
					default: instance.getVariableValue('presetKeyFrame') ?? PRESET_KEYFRAME_STATUES['disable'],
					choices: [
						{ id: PRESET_KEYFRAME_STATUES['disable'], label: 'Off', default: PRESET_KEYFRAME_STATUES['disable'] },
						{ id: PRESET_KEYFRAME_STATUES['enable'], label: 'On', default: PRESET_KEYFRAME_STATUES['enable'] },
					],
				},
			],
			callback: async (event) => {
				try {
					actionsObj['presetKeyFrame'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'PresetKeyFrame send error')
				}
			},
		}

		// 屏蔽 preset+take 和 preset+ky 的预设按键
		// actions['presetTakeAuto'] = {
		// 	name: 'Whether to execute Take when loading a preset to PGM(auto)',
		// 	options: [],
		// 	callback: async (event) => {
		// 		try {
		// 			event.options.presetTake = +!instance.getVariableValue('presetTake')
		// 			actionsObj['presetTake'].bind(instance)(event)
		// 		} catch (error) {
		// 			instance.log('error', 'PresetTakeAuto send error')
		// 		}
		// 	},
		// }

		// actions['presetKeyFrameAuto'] = {
		// 	name: 'Whether to execute KeyFrame when loading a preset to PGM(auto)',
		// 	options: [],
		// 	callback: async (event) => {
		// 		try {
		// 			event.options.presetKeyFrame = +!instance.getVariableValue('presetKeyFrame')
		// 			actionsObj['presetKeyFrame'].bind(instance)(event)
		// 		} catch (error) {
		// 			instance.log('error', 'PresetKeyFrameAuto send error')
		// 		}
		// 	},
		// }

		actions['specifiedScreenTake'] = {
			name: 'Execute Take on the specified screen',
			options: [
				{
					type: 'multidropdown',
					name: 'Screen',
					id: 'screenIds',
					minSelection: 1,
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
			],
			callback: async (event) => {
				try {
					actionsObj['specifiedScreenTake'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'specifiedScreenTake send error')
				}
			},
		}

		actions['specifiedScreenCut'] = {
			name: 'Execute Cut on the specified screen',
			options: [
				{
					type: 'multidropdown',
					name: 'Screen',
					id: 'screenIds',
					minSelection: 1,
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
			],
			callback: async (event) => {
				try {
					actionsObj['specifiedScreenCut'].bind(instance)(event)
				} catch (error) {
					instance.log('error', 'specifiedScreenCut send error')
				}
			},
		}

		actions['specifiedScreenFtb'] = {
			name: 'Execute FTB on the specified screen',
			options: [
				{
					type: 'multidropdown',
					name: 'Screen',
					id: 'screenIds',
					minSelection: 1,
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
				{
					type: 'dropdown',
					name: 'FTB',
					id: 'ftb',
					default: '1',
					choices: HTTP_Protocol_FTB,
				},
			],
			callback: async (event) => {
				try {
					actionsObj['specifiedScreenFtb'].bind(instance)(event, 'specified')
				} catch (error) {
					instance.log('error', 'specifiedScreenFtb send error')
				}
			},
		}

		actions['specifiedScreenFreeze'] = {
			name: 'Execute Freeze on the specified screen',
			options: [
				{
					type: 'multidropdown',
					name: 'Screen',
					id: 'screenIds',
					minSelection: 1,
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
				{
					type: 'dropdown',
					name: 'FRZ',
					id: 'freeze',
					default: '1',
					choices: HTTP_Protocol_FREEZE,
				},
			],
			callback: async (event) => {
				try {
					actionsObj['specifiedScreenFreeze'].bind(instance)(event, 'specified')
				} catch (error) {
					instance.log('error', 'specifiedScreenFreeze send error')
				}
			},
		}

		actions['specifiedScreenMatchPgm'] = {
			name: 'Execute Match PGM on the specified screen',
			options: [
				{
					type: 'multidropdown',
					name: 'Screen',
					id: 'screenIds',
					minSelection: 1,
					default: presetDefinitionScreen[0]?.screenId,
					choices: presetDefinitionScreen.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
			],
			callback: async (event) => {
				try {
					actionsObj['specifiedScreenMatchPgm'].bind(instance)(event, DIRECTION_TYPE.matchPgm)
				} catch (error) {
					instance.log('error', 'specifiedScreenMatchPgm send error')
				}
			},
		}
	}

	return actions
}
