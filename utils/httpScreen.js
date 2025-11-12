import got from 'got'
import { combineRgb } from '@companion-module/base'
import { FREEZE_STATUES, FTB_STATUES, NAME, SELECT_STATUES } from './constant.js'

export const updateScreenVaraiable = (list) => {
	const screensArr = list.map((item) => ({
		variableId: `screenId_${item.screenId}`,
		name: `Screen number: ${item.screenId}`,
		value: item.general.name,
	}))
	const screensObj = {}
	screensArr.forEach((variable) => {
		screensObj[variable.variableId] = variable.value
	})
	return {
		screenVariableDefinitions: screensArr,
		screenDefaultVariableValues: screensObj,
	}
}

export const getScreenFormatData = (list, instance) => {
	const screenPresets = {}
	for (let i = 1; i <= list.length; i++) {
		const item = list[i - 1]
		const screen = {
			type: 'button',
			category: 'Screens',
			name: item.general.name,
			screenId: item.screenId,
			screenIdObj: item.screenIdObj, // 场景加载后需要通过该数据来确认选中屏幕id(screenId)
			style: {
				text: `$(${NAME}:screenId_${item.screenId})`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'changeScreen',
							options: {
								screenId: item.screenId,
							},
						},
					],
				},
			],
			feedbacks: [
				{
					feedbackId: 'screen',
					style: {
						bgcolor: combineRgb(26, 145, 250),
					},
					options: {
						screenId: item.screenId,
					},
				},
			],
		}

		screenPresets['screen-play' + item.screenId] = screen
		// 默认未选中屏幕
		instance.screenSelect[item.screenId] = instance.screenSelect[item.screenId] ?? SELECT_STATUES.disable
	}
	instance.checkFeedbacks('screen')
	return screenPresets
}

export const getScreenPresets = async (url, token, event) => {
	const res = await got
		.get(`${url}/screen/list-detail`, {
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
