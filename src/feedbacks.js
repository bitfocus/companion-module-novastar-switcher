import { combineRgb } from '@companion-module/base'
import { isHttpDevice, isHttpDeviceWithDQ } from '../utils/index.js'
import {
	FTB_STATUES,
	FREEZE_STATUES,
	PRESET_KEYFRAME_STATUES,
	PRESET_TAKE_STATUES,
	SELECT_STATUES,
	HTTP_PRESET_TYPE,
	SCENE_TYPE,
} from '../utils/constant.js'

export const getFeedbacks = (instance) => {
	let feedbacks = {}

	feedbacks['ftb'] = {
		type: 'boolean',
		name: 'Selected Screen FTB Status Detection',
		description: 'Update button style on FTB status change',
		defaultStyle: {
			bgcolor: combineRgb(255, 0, 0),
		},
		options: [],
		callback: () => instance.config.ftb === FTB_STATUES.enable,
	}

	feedbacks['freeze'] = {
		type: 'boolean',
		name: 'Selected Screen Freeze Status Detection',
		description: 'Update button style on Freeze status change',
		defaultStyle: {
			bgcolor: combineRgb(255, 0, 0),
		},
		options: [],
		callback: () => instance.config.freeze === FREEZE_STATUES.enable,
	}

	feedbacks['pgm'] = {
		type: 'boolean',
		name: 'Preset Load to PGM Status Detection',
		description: 'Update button style when preset loading area changes to PGM',
		defaultStyle: {
			bgcolor: combineRgb(255, 0, 0),
		},
		options: [],
		callback: () => instance.config.presetType === 'pgm',
	}

	if (isHttpDevice(instance)) {
		feedbacks['screen'] = {
			type: 'boolean',
			name: 'Screen Selection Status Detection',
			description: 'Update button style when screen is selected',
			defaultStyle: {
				bgcolor: combineRgb(26, 145, 250),
			},
			options: [
				{
					type: 'dropdown',
					label: 'screen',
					id: 'screenId',
					default: Object.values(instance.presetDefinitionScreen ?? [])[0]?.screenId,
					choices: Object.values(instance.presetDefinitionScreen ?? [])?.map((item) => ({
						id: item.screenId,
						label: item.name,
					})),
				},
			],
			callback: (event) => instance.screenSelect[event.options.screenId] === SELECT_STATUES.enable,
		}

		feedbacks['layer'] = {
			type: 'boolean',
			name: 'Layer Selection Status Detection',
			description: 'Update button style on layer selection change',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
			},
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
			],
			callback: (event) => {
				const { screenId, sceneType, layerIndex } = event.options
				return instance.layerSelect === `${screenId}-${sceneType}-${layerIndex}`
			},
		}

		feedbacks['specified-screen-ftb'] = {
			type: 'boolean',
			name: 'Specified Screen FTB Status Detection',
			description: 'Update button style on FTB status change',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [],
			callback: (event) => instance.specifiedScreenFtbStatus[event.controlId] === FTB_STATUES.enable,
		}

		feedbacks['specified-screen-freeze'] = {
			type: 'boolean',
			name: 'Specified Screen Freeze Status Detection',
			description: 'Update button style on Freeze status change',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [],
			callback: (event) => instance.specifiedScreenFreezeStatus[event.controlId] === FREEZE_STATUES.enable,
		}

		feedbacks['preset-pvw'] = {
			type: 'boolean',
			name: 'Load to PVW Status Detection',
			description: 'Update button style when preset is loaded to PVW',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 255, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'preset',
					id: 'presetId',
					default: Object.values(instance.presetDefinitionPreset ?? [])[0]?.presetId,
					choices: Object.values(instance.presetDefinitionPreset ?? [])?.map((item) => ({
						id: item.presetId,
						label: item.name,
					})),
				},
			],
			callback: (event) => instance.presetStatus[event.options.presetId] === HTTP_PRESET_TYPE.pvw,
		}

		feedbacks['preset-pgm'] = {
			type: 'boolean',
			name: 'Load to PGM Status Detection',
			description: 'Update button style when preset is loaded to PGM',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'preset',
					id: 'presetId',
					default: Object.values(instance.presetDefinitionPreset ?? [])[0]?.presetId,
					choices: Object.values(instance.presetDefinitionPreset ?? [])?.map((item) => ({
						id: item.presetId,
						label: item.name,
					})),
				},
			],
			callback: (event) =>
				[HTTP_PRESET_TYPE.pgm, HTTP_PRESET_TYPE.pgmpvw].includes(instance.presetStatus[event.options.presetId]),
		}

		feedbacks['presetTake'] = {
			type: 'boolean',
			name: 'Take Status on Preset Loading Detection',
			description: 'Update button style when Take is enabled',
			defaultStyle: {
				bgcolor: combineRgb(10, 132, 255),
			},
			options: [],
			callback: () => {
				instance.log('debug', `feedback-presetTake: ${instance.getVariableValue('presetTake')}`)
				return instance.getVariableValue('presetTake') === PRESET_TAKE_STATUES.enable
			},
		}

		feedbacks['presetKeyFrame'] = {
			type: 'boolean',
			name: 'KeyFrame Status on Preset Loading Detection',
			description: 'Update button style when KeyFrame is enabled',
			defaultStyle: {
				bgcolor: combineRgb(10, 132, 255),
			},
			options: [],
			callback: () => {
				instance.log('debug', `feedback-presetKeyFrame: ${instance.getVariableValue('presetKeyFrame')}`)
				return instance.getVariableValue('presetKeyFrame') === PRESET_KEYFRAME_STATUES.enable
			},
		}

		if (isHttpDeviceWithDQ(instance)) {
			feedbacks['mapping'] = {
				type: 'boolean',
				name: 'Mapping Status Detection',
				description: 'Change the style when mapping is pressed',
				defaultStyle: {
					bgcolor: combineRgb(255, 0, 0),
				},
				options: [],
				callback: () => instance.config.mapping === '1',
			}
		}
	}

	return feedbacks
}
