import got from 'got'
import {
	DIRECTION_TYPE,
	FREEZE_STATUES,
	FTB_STATUES,
	HTTP_PRESET_TYPE,
	PRESET_KEYFRAME_STATUES,
	PRESET_TAKE_STATUES,
	SELECT_STATUES,
	SWAP_STATUES,
} from './constant.js'
import { handleReqWithToken } from './index.js'
import { getDevicePresets } from './httpPresets.js'
import { findLayerIdByUniqueId, getLayerList } from './httpLayers.js'

async function getTakeReq(token, event) {
	this.log('info', `getTakeReq-event: ${JSON.stringify(event)}`)
	const selectScreenIds = event?.options?.screenIds
		? event.options.screenIds
		: Object.keys(this.screenSelect).filter((key) => this.screenSelect[key] === SELECT_STATUES.enable)
	if (selectScreenIds.length === 0) {
		this.log('info', 'No screen selected, operation cannot be executed.')
		return
	}
	const taketime = (this.getVariableValue('time') ?? 0.5) * 1000
	const swapEnable = this.getVariableValue('swapStatus') === 'Swap' ? SWAP_STATUES.swap : SWAP_STATUES.copy
	const obj = selectScreenIds.map((item) => {
		return {
			screenId: +item,
			direction: 0,
			effectSelect: 1,
			switchEffect: {
				time: taketime,
				type: this.takeType,
			},
			swapEnable,
		}
	})
	this.log('debug', `getTakeReq-obj: ${JSON.stringify(obj)}`)
	const res = await got.put(`${this.config.baseURL}/screen/take`, {
		headers: {
			Authorization: token,
			ip: this.config?.UCenterFlag?.ip,
			port: this.config?.UCenterFlag?.port,
			protocol: this.config?.UCenterFlag?.protocol,
		},
		https: {
			rejectUnauthorized: false,
		},
		json: obj,
	})
	this.log('debug', `Take设置响应: ${res.body}`)
	return res
}

async function getCutReq(token, event, direction) {
	const selectScreenIds = event?.options?.screenIds
		? event.options.screenIds
		: Object.keys(this.screenSelect).filter((key) => this.screenSelect[key] === SELECT_STATUES.enable)
	if (selectScreenIds.length === 0) {
		this.log('info', 'No screen selected, operation cannot be executed.')
		return
	}
	const swapEnable = this.getVariableValue('swapStatus') === 'Swap' ? SWAP_STATUES.swap : SWAP_STATUES.copy
	const obj = selectScreenIds.map((item) => {
		return {
			screenId: +item,
			direction: +direction || DIRECTION_TYPE.cut,
			swapEnable,
		}
	})
	this.log('debug', `get${direction == DIRECTION_TYPE.cut ? 'Cut' : 'PGM'}Req-obj: ${JSON.stringify(obj)}`)
	const res = await got.put(`${this.config.baseURL}/screen/cut`, {
		headers: {
			Authorization: token,
			ip: this.config?.UCenterFlag?.ip,
			port: this.config?.UCenterFlag?.port,
			protocol: this.config?.UCenterFlag?.protocol,
		},
		https: {
			rejectUnauthorized: false,
		},
		json: obj,
	})
	this.log('debug', `Cut设置响应: ${res.body}`)
	return res
}

async function getFTBReq(token, event, type) {
	let selectScreenIds = []
	if (type === 'specified') {
		selectScreenIds = event.options.screenIds
		console.log(`getFTBReq-selectScreenIds: ${JSON.stringify(selectScreenIds)}, event: ${JSON.stringify(event)}`)
		this.specifiedScreenFtbStatus[event.controlId] = event.options.ftb
		this.checkFeedbacks('specified-screen-ftb')
	} else {
		selectScreenIds = Object.keys(this.screenSelect).filter((key) => this.screenSelect[key] === SELECT_STATUES.enable)
		this.config.ftb = event.options.ftb
		this.checkFeedbacks('ftb')
	}
	const obj = selectScreenIds.map((item) => {
		return {
			screenId: +item,
			ftb: {
				enable: Number(event.options.ftb),
				time: 700,
			},
		}
	})
	this.log('debug', `getFTBReq-obj: ${JSON.stringify(obj)}`)
	const res = await got.put(`${this.config.baseURL}/screen/ftb`, {
		headers: {
			Authorization: token,
			ip: this.config?.UCenterFlag?.ip,
			port: this.config?.UCenterFlag?.port,
			protocol: this.config?.UCenterFlag?.protocol,
		},
		https: {
			rejectUnauthorized: false,
		},
		json: obj,
	})
	this.log('debug', `FTB设置响应: ${res.body}`)
	return res
}

async function getFreezeReq(token, event, type) {
	let selectScreenIds = []
	if (type === 'specified') {
		selectScreenIds = event.options.screenIds
		this.specifiedScreenFreezeStatus[event.controlId] = event.options.freeze
		this.checkFeedbacks('specified-screen-freeze')
	} else {
		selectScreenIds = Object.keys(this.screenSelect).filter((key) => this.screenSelect[key] === SELECT_STATUES.enable)
		this.config.freeze = event.options.freeze
		this.checkFeedbacks('freeze')
	}

	const obj = selectScreenIds.map((item) => {
		return {
			screenId: +item,
			freeze: +event.options.freeze,
		}
	})
	this.log('debug', `getFreezeReq-obj: ${JSON.stringify(obj)}`)
	const res = await got.put(`${this.config.baseURL}/screen/freeze`, {
		headers: {
			Authorization: token,
			ip: this.config?.UCenterFlag?.ip,
			port: this.config?.UCenterFlag?.port,
			protocol: this.config?.UCenterFlag?.protocol,
		},
		https: {
			rejectUnauthorized: false,
		},
		json: obj,
	})
	this.log('debug', `Freeze设置响应: ${res.body}`)
	return res
}

async function getPresetReq(token, event) {
	const sceneType = HTTP_PRESET_TYPE[this.getVariableValue('sceneType') ?? 'pvw'] // 默认应为auto，暂时改为pvw
	const keyFrame = this.getVariableValue('presetKeyFrame') ?? PRESET_KEYFRAME_STATUES.disable
	const effect = this.getVariableValue('presetTake') ?? PRESET_TAKE_STATUES.disable
	const swapEnable = this.getVariableValue('swapStatus') === 'Swap' ? SWAP_STATUES.swap : SWAP_STATUES.copy
	const time = this.getVariableValue('time') ?? 0.5
	const obj = [
		{
			sn: this.config.sn,
			data: {
				id: event.options.preset, // 场景创建的i
				presetId: event.options.presetId,
				serial: event.options.serial,
				targetRegion: sceneType,
				auxiliary: {
					keyFrame: {
						enable: keyFrame,
					},
					effect: {
						enable: effect,
					},
					switchEffect: {
						time: time * 1000, //ms
						type: this.takeType,
					},
					swapEnable: swapEnable,
				},
			},
		},
	]

	const updatePresetInfo = async () => {
		const presetListRes = await getDevicePresets(this.config.baseURL, token, this)
		if (presetListRes?.code === 0) {
			const presetList = presetListRes?.data?.list
			// 更新所有场景的加载区域
			this.presetStatus = presetList.reduce((acc, item) => {
				acc[item.guid] = item.currentRegion
				return acc
			}, this.presetStatus || {})

			this.log(
				'debug',
				`更新场景信息-presetList：${JSON.stringify(presetList)} ，presetStatus：${JSON.stringify(this.presetStatus)}`
			)
			const currentPreset = presetList.find((item) => item.guid === event.options.presetId)
			const { currentRegion = 0, screens = [], switchEffect } = currentPreset
			let _time = switchEffect?.time
			_time = _time && _time >= 100 && _time <= 10000 ? _time / 1000 : time // 确保时间在合理范围内
			this.setVariableValues({ time: _time })
			Object.keys(this.screenSelect).map((screenId) => {
				this.screenSelect[screenId] = SELECT_STATUES.disable
			})
			screens.forEach((screen) => {
				const matchedScreen = Object.values(this.presetDefinitionScreen).find(
					(item) => item.screenIdObj.id === screen.screenIdObj.id && item.screenIdObj.type === screen.screenIdObj.type
				)
				if (matchedScreen) {
					this.screenSelect[matchedScreen.screenId] = SELECT_STATUES.enable
				}
			})
			this.log(
				'debug',
				`场景设置响应列表, 当前场景的应用区域: ${currentRegion},
        选中的屏幕: ${JSON.stringify(screens)},
        场景的状态：${JSON.stringify(this.presetStatus)}`
			)
			return presetListRes?.code
		}
	}

	this.log('debug', `getPresetReq-obj: ${JSON.stringify(obj)}`)
	const res = await got
		.post(`${this.config.baseURL}/ucenter/preset/apply`, {
			headers: {
				Authorization: token,
				ip: this.config?.UCenterFlag?.ip,
				port: this.config?.UCenterFlag?.port,
				protocol: this.config?.UCenterFlag?.protocol,
			},
			https: {
				rejectUnauthorized: false,
			},
			json: obj,
		})
		.json()
	this.log('debug', `场景设置响应${JSON.stringify(res)}`)

	// 查询场景列表获取当前场景的应用区域和选中的屏幕信息
	let count = 0
	if (res?.code === 0) {
		const timer = setInterval(async () => {
			count += 1
			await updatePresetInfo()
			this.checkFeedbacks('screen', 'preset-pvw', 'preset-pgm')
			this.log('debug', `场景设置成功后${count * 100}ms后的check`)
			if (count >= 3) {
				clearInterval(timer)
			}
		}, 100)
	}

	return res
}

// 选中图层
async function getLayerReq(token, event) {
	// for (let key in this.layerSelect) {
	// 	this.layerSelect[key] = false
	// }
	// this.layerSelect[event.options.layerId] = this.layerSelect[event.options.layerId] === 1 ? 0 : 1
	// this.checkFeedbacks('layer')
	// const obj = [
	// 	{
	// 		layerId: event.options.layerId,
	// 		selected: this.layerSelect[event.options.layerId] === 1 ? 0 : 1,
	// 	},
	// ]
	// const res = await got
	// 	.put(`${this.config.baseURL}/layers/select`, {
	// 		headers: {
	// 			Authorization: token,
	// 			ip: this.config?.UCenterFlag?.ip,
	// 			port: this.config?.UCenterFlag?.port,
	// 			protocol: this.config?.UCenterFlag?.protocol,
	// 		},
	// 		https: {
	// 			rejectUnauthorized: false,
	// 		},
	// 		json: obj,
	// 	})
	// 	.json()
	// this.layerSelect[event.options.layerId] = this.layerSelect[event.options.layerId] === 1 ? 0 : 1
	// this.checkFeedbacks('layer')
	// return res
}

async function getLayersSourceReq(token, event) {
	if (this.layerSelect === -1) return

	// 获取图层列表，根据图层序号lay获取真实layerId
	const layerList = await getLayerList.call(this)
	const layerId = findLayerIdByUniqueId(layerList, this.layerSelect)

	this.log('debug', `图层切源的图层id匹配,layerSelect：${this.layerSelect}, 图层id: ${layerId}`)
	if (layerId === -1) return

	const obj = [
		{
			layerId: Number(layerId),
			source: {
				general: {
					sourceId: event.options.sourceId,
					sourceType: event.options.sourceType,
					relationId: 0,
				},
			},
		},
	]

	this.log('debug', JSON.stringify(obj))
	const res = await got
		.put(`${this.config.baseURL}/layers/source`, {
			headers: {
				Authorization: token,
				ip: this.config?.UCenterFlag?.ip,
				port: this.config?.UCenterFlag?.port,
				protocol: this.config?.UCenterFlag?.protocol,
			},
			https: {
				rejectUnauthorized: false,
			},
			json: obj,
		})
		.json()

	this.log('debug', `切源响应${JSON.stringify(res)}`)

	return res
}

async function setMappingReq(token, event) {
	this.config.mapping = event.options.mapping
	this.checkFeedbacks('mapping')
	const obj = {
		nodeId: 1,
		enable: +event.options.mapping,
	}
	this.log('debug', `setMappingReq: ${JSON.stringify(obj)}}`)
	const res = await got.put(`${this.config.baseURL}/node/interface-location`, {
		headers: {
			Authorization: token,
			ip: this.config?.UCenterFlag?.ip,
			port: this.config?.UCenterFlag?.port,
			protocol: this.config?.UCenterFlag?.protocol,
		},
		https: {
			rejectUnauthorized: false,
		},
		json: obj,
	})
	this.log('debug', `${res.body}`)
	return res
}

function handlePresetType(event) {
	this.log('debug', `presetType: ${event.options.presetType}, last-presetType: ${this.config.presetType}`)
	switch (event.options.presetType) {
		case 'pvw':
			this.config.presetType = 'pvw'
			this.setVariableValues({
				sceneType: 'pvw',
				presetTake: PRESET_TAKE_STATUES.disable,
				presetKeyFrame: PRESET_KEYFRAME_STATUES.disable,
				loadPresetAttrInfo: 'PVW',
			})
			break
		case 'pgm':
			this.config.presetType = 'pgm'
			this.setVariableValues({
				sceneType: 'pgm',
				presetTake: PRESET_TAKE_STATUES.disable,
				presetKeyFrame: PRESET_KEYFRAME_STATUES.disable,
				loadPresetAttrInfo: 'PGM',
			})
			break
		case 'pgmTake':
			this.config.presetType = 'pgm'
			this.setVariableValues({
				sceneType: 'pgm',
				presetTake: PRESET_TAKE_STATUES.enable,
				presetKeyFrame: PRESET_KEYFRAME_STATUES.disable,
				loadPresetAttrInfo: 'PGM\nTake',
			})
			break
		case 'pgmTakeKeyFrame':
			this.config.presetType = 'pgm'
			this.setVariableValues({
				sceneType: 'pgm',
				presetTake: PRESET_TAKE_STATUES.enable,
				presetKeyFrame: PRESET_KEYFRAME_STATUES.enable,
				loadPresetAttrInfo: 'PGM\nTake KF',
			})
			break
	}
	this.checkFeedbacks('pgm')
}

function handleHttpTake(event) {
	handleReqWithToken.bind(this)(getTakeReq, event)
}

function handleHttpCut(event, direction) {
	handleReqWithToken.bind(this)(getCutReq, event, direction)
}

function handleHttpFTB(event, type) {
	handleReqWithToken.bind(this)(getFTBReq, event, type)
}

function handleHttpFreeze(event, type) {
	handleReqWithToken.bind(this)(getFreezeReq, event, type)
}

function handleHttpPreset(event) {
	handleReqWithToken.bind(this)(getPresetReq, event)
}

function handleScreen(event) {
	const status =
		event.options.select ??
		(!!this.screenSelect[event.options.screenId] ? SELECT_STATUES.disable : SELECT_STATUES.enable)
	this.screenSelect[event.options.screenId] = status
	this.checkFeedbacks('screen')
	this.log('debug', `handleScreen-screenSelect: ${JSON.stringify(this.screenSelect)}`)
}

function handleLayer(event) {
	const { selected, screenId, sceneType, layerIndex } = event.options
	this.layerSelect = selected === '0' ? -1 : `${screenId}-${sceneType}-${layerIndex}`
	this.log('debug', `选中图层：${JSON.stringify(this.layerSelect)}`)
	this.checkFeedbacks('layer')
}

function handleDeselectLayer() {
	this.layerSelect = -1
	this.checkFeedbacks('layer')
}

function handleHttpSource(event) {
	handleReqWithToken.bind(this)(getLayersSourceReq, event)
}

function handleSwapCopy(event) {
	this.setVariableValues({ swapStatus: +event.options.swapCopy === SWAP_STATUES.swap ? 'Swap' : 'Copy' })
}

function handleTakeTime(event) {
	const direction = event.options.direction
	let currentTime = this.getVariableValue('time') ?? 0.5
	if (direction === 'left') {
		const time = +currentTime * 1000 - 100
		currentTime = time >= 100 ? time / 1000 : 0.1
	} else if (direction === 'right') {
		const time = +currentTime * 1000 + 100
		currentTime = time <= 10000 ? time / 1000 : 10
	}
	this.setVariableValues({ time: currentTime })
	this.log('debug', `takeTime_direction: ${event.options.direction}, currentTime: ${currentTime}`)
}

function handleHttpMapping(event) {
	handleReqWithToken.bind(this)(setMappingReq, event)
}

function handlePresetEffect(event) {
	const isEnable = event.options.presetTake === PRESET_TAKE_STATUES.enable
	if (isEnable) {
		this.setVariableValues({ presetTake: PRESET_TAKE_STATUES.enable })
	} else {
		this.setVariableValues({
			presetTake: PRESET_TAKE_STATUES.disable,
			presetKeyFrame: PRESET_KEYFRAME_STATUES.disable,
		})
	}
	this.checkFeedbacks('presetTake', 'presetKeyFrame')
}

function handlePresetEffectKeyFrame(event) {
	const isEnable = event.options.presetKeyFrame === PRESET_KEYFRAME_STATUES.enable
	this.setVariableValues({
		presetTake: PRESET_TAKE_STATUES[isEnable ? 'enable' : 'disable'],
		presetKeyFrame: PRESET_KEYFRAME_STATUES[isEnable ? 'enable' : 'disable'],
	})
	this.checkFeedbacks('presetTake', 'presetKeyFrame')
}

export const httpActions = {
	take: handleHttpTake,
	cut: handleHttpCut,
	ftb: handleHttpFTB,
	freeze: handleHttpFreeze,
	presetType: handlePresetType,
	preset: handleHttpPreset,
	screen: handleScreen,
	layer: handleLayer,
	source: handleHttpSource,
	swapCopy: handleSwapCopy,
	matchPgm: handleHttpCut,
	takeTime: handleTakeTime,
	mapping: handleHttpMapping,
	presetTake: handlePresetEffect,
	presetKeyFrame: handlePresetEffectKeyFrame,
	specifiedScreenTake: handleHttpTake,
	specifiedScreenCut: handleHttpCut,
	specifiedScreenFtb: handleHttpFTB,
	specifiedScreenFreeze: handleHttpFreeze,
	specifiedScreenMatchPgm: handleHttpCut,
	deselectLayer: handleDeselectLayer,
}
