import got from 'got'
import { combineRgb } from '@companion-module/base'
import { HTTP_PRESET_TYPE, NAME } from './constant.js'

export const updatePresetVaraiable = (list) => {
	const presetArr = list.map((item) => ({
		variableId: `presetId_${item.guid}`,
		name: `Preset number: ${item.guid}`,
		value: item.name,
	}))
	const presetObj = {}
	presetArr.forEach((variable) => {
		presetObj[variable.variableId] = variable.value
	})
	return {
		presetVariableDefinitions: presetArr,
		presetDefaultVariableValues: presetObj,
	}
}

export const getPresetFormatData = (list, instance) => {
	const playPresets = {}
	for (let i = 1; i <= list.length; i++) {
		const item = list[i - 1]
		const preset = {
			type: 'button',
			category: 'Presets',
			name: item.name,
			presetId: item.guid,
			serial: item.serial, // 添加 serial 参数
			i: i,
			style: {
				text: `$(${NAME}:presetId_${item.guid})`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'preset',
							options: {
								presetId: item.guid,
								preset: i,
							},
						},
					],
				},
			],
			feedbacks: [
				{
					feedbackId: 'preset-pvw',
					style: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(0, 255, 0),
					},
					options: {
						presetId: item.guid,
					},
				},
				{
					feedbackId: 'preset-pgm',
					style: {
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(255, 0, 0),
					},
					options: {
						presetId: item.guid,
						serial: item.serial, // 在 feedback options 中添加 serial 参数
					},
				},
			],
		}
		playPresets['preset-play' + item.guid] = preset
		instance.presetStatus[item.guid] = item.currentRegion ?? HTTP_PRESET_TYPE.pvw // 默认应为auto，暂时改为pvw
		instance.checkFeedbacks('screen', 'preset-pvw', 'preset-pgm')
	}
	return playPresets
}

export const getDevicePresets = async (url, token, event) => {
	const res = await got
		.get(`${url}/preset`, {
			headers: {
				Authorization: token,
				ip: event.config?.UCenterFlag?.ip,
				port: event.config?.UCenterFlag?.port,
				protocol: event.config?.UCenterFlag?.protocol,
			},
			https: {
				rejectUnauthorized: false,
			},
		})
		.json()

	return res
}
