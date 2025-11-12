import got from 'got'
import { combineRgb } from '@companion-module/base'
import { NAME, SCENE_TYPE } from './constant.js'

const formatName = (screen, scene, index, isScreenNameVaraiable) => {
	const screenName = isScreenNameVaraiable ? `$(${NAME}:screenId_${screen.screenId})` : screen?.general.name
	return `${screenName}\n${scene.label}\nL${index}`
}

export const getLayerFormatData = (screenList = [], instance) => {
	const playPresets = {}

	screenList.forEach((screen) => {
		SCENE_TYPE.forEach((scene) => {
			const index = 1
			const name = formatName(screen, scene, index, false)
			const layer = {
				type: 'button',
				category: 'Layers',
				name,
				style: {
					text: formatName(screen, scene, index, true),
					size: 'auto',
					color: combineRgb(0, 0, 0),
					bgcolor: combineRgb(0, 255, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'layer',
								options: {
									selected: '1',
									screenId: screen.screenId,
									sceneType: scene.id,
									layerIndex: index,
								},
							},
						],
					},
				],
				feedbacks: [
					{
						feedbackId: 'layer',
						style: {
							bgcolor: combineRgb(255, 0, 0),
						},
						options: {
							screenId: screen.screenId,
							sceneType: scene.id,
							layerIndex: index,
						},
					},
				],
			}
			playPresets[`${screen.screenId}-${scene.id}-${index}`] = layer
		})
	})

	// 全局-取消图层选中
	playPresets['deselectLayer'] = {
		type: 'button',
		category: 'Layers',
		name: 'Deselect Layer',
		style: {
			text: 'Deselect Layer',
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'deselectLayer',
						options: {},
					},
				],
			},
		],
		feedbacks: [],
	}

	return playPresets
}

export const getLayerPresets = async (url, token, event) => {
	const res = await got
		.get(`${url}/layers/list-detail`, {
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

// 获取图层列表
export async function getLayerList() {
	this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico/v1`
	let obj = []
	try {
		const res = await getLayerPresets(this.config.baseURL, this.config.token, this)
		if (res.code === 0) {
			// 源类型 【 0：空图层 1：无源； 2：输入类型；3：PGM；4：PVW； 5：BKG图片 6：LOGO图片  7：IPC类型8：截取源类型 9:   拼接源 10: ipc拼接屏11: 内置源12：内置图形源 13：图片OSD 14:文字OSD】
			// 获取全量图层匹配layerId，无需过滤
			obj = res.data.list ?? []
		}
	} catch (e) {}
	return obj
}

/**
 * 根据图层唯一id查找layerId
 * @param {Array} data 源数据数组
 * @param {string} uniqueId 图层唯一id，格式为 screenId-screentype-index
 * @returns {number} 找到则返回layerId，找不到返回-1
 */
export const findLayerIdByUniqueId = (data, uniqueId) => {
	for (const item of data) {
		const { layerId, layerIdObj, serial } = item
		const screenId = layerIdObj.attachScreenId
		const screentype = layerIdObj.sceneType
		const index = serial
		const id = `${screenId}-${screentype}-${index}`
		if (id === uniqueId) {
			return layerId
		}
	}
	return -1
}
