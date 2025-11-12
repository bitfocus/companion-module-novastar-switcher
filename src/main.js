import { InstanceBase, InstanceStatus, TCPHelper, UDPHelper, Regex, runEntrypoint } from '@companion-module/base'
import ping from 'ping'

import { getActions } from './actions.js'
import { getPresetDefinitions } from './presets.js'
import { getFeedbacks } from './feedbacks.js'
import { upgradeScripts } from './upgrades.js'
import { getVaraiableDefinitions } from './variables.js'

import {
	HTTP_DEVICES,
	PROTOCOL_TYPE,
	CMD_DEVICES,
	DEVICES_INFORMATION,
	DEVICE_PROTOCOL,
	TAKE_TYPE,
	defaultVariableDefinitions,
} from '../utils/constant.js'
import { generateToken, getDeviceList, getOpenDetail, getSystemDeviceInfo } from '../utils/index.js'
import { getDevicePresets, getPresetFormatData, updatePresetVaraiable } from '../utils/httpPresets.js'
import { getScreenPresets, getScreenFormatData, updateScreenVaraiable } from '../utils/httpScreen.js'
import { getLayerFormatData } from '../utils/httpLayers.js'
import { getSourcePresets, getSourceFormatData, updateSourceVaraiable } from '../utils/httpSource.js'

const LATCH_ACTIONS = ['ftb', 'freeze', 'presetType', 'swapCopy']
class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.PROTOCOL_TYPE = Object.values(PROTOCOL_TYPE)

		this.DEVICES_INFO = getSystemDeviceInfo()
		this.DEVICES = Object.values(this.DEVICES_INFO)

		// 图层选中唯一
		this.layerSelect = -1
		this.screenSelect = {}
		this.presetStatus = {}
		this.specifiedScreenFtbStatus = {}
		this.specifiedScreenFreezeStatus = {}
		this.presetDefinitionPreset = {}
		this.presetDefinitionScreen = {}
		this.presetDefinitionLayer = {}
		this.presetDefinitionSource = {}
		this.takeType = TAKE_TYPE['fade']

		// Sort alphabetical
		this.DEVICES.sort(function (a, b) {
			var x = a.label.toLowerCase()
			var y = b.label.toLowerCase()
			if (x < y) {
				return -1
			}
			if (x > y) {
				return 1
			}
			return 0
		})
	}

	updateActions() {
		this.log('debug', 'update actions....')
		this.setActionDefinitions(getActions(this))
	}

	updateFeedbacks() {
		this.setFeedbackDefinitions(getFeedbacks(this))
	}

	// Return config fields for web config
	getConfigFields() {
		this.log('getting the fields....')
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: DEVICES_INFORMATION,
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				width: 6,
				default: '192.168.0.10',
				regex: Regex.IP,
				required: true,
			},
			{
				type: 'dropdown',
				id: 'modelId',
				label: 'Model',
				width: 6,
				choices: this.DEVICES,
				default: this.DEVICES[0].id,
			},
		]
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy:' + this.id)
		if (this.socket !== undefined) {
			this.socket.destroy()
		}
		if (this.udp !== undefined) {
			this.udp.destroy()
		}
		if (this.heartbeat) {
			clearInterval(this.heartbeat)
			delete this.heartbeat
		}
		// 删除心跳
		if (this.presetBeat) {
			clearInterval(this.presetBeat)
			delete this.presetBeat
		}
	}

	/** Switcher devices handle start */
	async getDevicesByUCenter() {
		this.log('debug', `getDevicesByUCenter-start...`)

		this.config.protocol = 'https'
		this.config.port = '19998'
		this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico/v1`

		try {
			const devicesRes = await getDeviceList(this.config.baseURL)

			if (devicesRes.code === 0) {
				const device = devicesRes.data?.list?.find((item) => item.ip === this.config.host)
				const deviceProtocol = device?.protocols?.find((item) => item.linkType === 'http') ?? DEVICE_PROTOCOL
				const { linkType: protocol, port } = deviceProtocol
				// 该信息需在server接口header中同步下发
				this.config.UCenterFlag = {
					protocol,
					port,
					ip: '127.0.0.1',
				}
				this.log(
					'info',
					`getDevicesByUCenter-protocol:${JSON.stringify(deviceProtocol)},
          UCenterFlag:${JSON.stringify(this.config.UCenterFlag)}`
				)
				await this.getDeviceStatusByOpenDetail()
			}
		} catch (e) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Please reconfigure the device connection information.')
		}
	}

	async getDeviceStatusByOpenDetail() {
		this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico/v1`
		this.log('debug', `getDeviceStatusByOpenDetail-url:${this.config.baseURL} - ${new Date().getTime()}`)

		const res = await getOpenDetail(this.config.baseURL, this.config.UCenterFlag)
		this.log('debug', `getDeviceStatusByOpenDetail-res:${JSON.stringify(res)}`)

		if (res.code === 0) {
			this.config.sn = res.data.sn
			this.config.token = generateToken(res.data.sn, res.data.startTime)
			this.log('debug', `generateToken-res: ${this.config.token}`)
			this.updateStatus(InstanceStatus.Ok)

			if (HTTP_DEVICES.includes(this.config.modelId)) {
				this.getAllData()
				this.presetBeat = setInterval(() => this.getAllData(), 10000) //check every 10s
			}
		} else if (res.code === 8273) {
			this.log('debug', `getDeviceStatusByOpenDetail-Interface exception: ${JSON.stringify(res)}`)
			throw Error('Interface exception')
		} else {
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}

	async getPresetList() {
		this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico/v1`
		let obj = []
		try {
			const res = await getDevicePresets(this.config.baseURL, this.config.token, this)
			if (res.code === 0) {
				obj = res.data.list
				this.log('debug', `getPresetList-res:${JSON.stringify(obj)}`)
			}
		} catch (e) {}
		return obj
	}

	async getScreenList() {
		this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico/v1`
		let obj = []
		try {
			const res = await getScreenPresets(this.config.baseURL, this.config.token, this)
			if (res.code === 0) {
				// 屏幕状态enable【0：禁用；1：启用】
				obj = (res.data.list ?? []).filter((item) => item.enable == 1)
			}
		} catch (e) {}
		return obj
	}

	async getSourceList() {
		this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico/v1`
		// 由于图层需要拼接
		let obj = []
		try {
			const res = await getSourcePresets(this.config.baseURL, this.config.token, this)
			if (res.code === 0) {
				obj = res.data.list
			}
		} catch (e) {}
		return obj
	}

	async getAllData() {
		Promise.all([this.getPresetList(), this.getScreenList(), this.getSourceList()]).then((res) => {
			const presetList = res[0]
			const screenList = res[1]
			// 屏幕类型：【0：空屏幕；2:普通屏幕;4:AUX屏幕;8:MVR屏幕；16:回显屏幕；32：led屏幕】
			// 目前只展示普通屏幕、AUX屏幕
			const screenFilterLiter = screenList
				.filter((item) => item.screenIdObj.type === 2 || item.screenIdObj.type === 4)
				.sort((a, b) => {
					if (a.screenIdObj.type === b.screenIdObj.type) return 0
					if (a.screenIdObj.type === 2) return -1 // 普通屏幕在前
					if (a.screenIdObj.type === 4) return 1 // AUX屏幕在后
					return 0
				})
			const sourceList = res[2]

			// 新增变量
			const { screenVariableDefinitions, screenDefaultVariableValues } = updateScreenVaraiable(screenFilterLiter)
			const { presetVariableDefinitions, presetDefaultVariableValues } = updatePresetVaraiable(presetList)
			const { sourceVariableDefinitions, sourceDefaultVariableValues } = updateSourceVaraiable(sourceList)
			// 处理变量
			this.setVariableDefinitions([
				...defaultVariableDefinitions,
				...screenVariableDefinitions,
				...presetVariableDefinitions,
				...sourceVariableDefinitions,
			])
			this.setVariableValues({
				...screenDefaultVariableValues,
				...presetDefaultVariableValues,
				...sourceDefaultVariableValues,
			})

			this.presetDefinitionPreset = {}
			this.presetDefinitionScreen = {}
			this.presetDefinitionLayer = {}
			this.presetDefinitionSource = {}

			this.presetDefinitionPreset = getPresetFormatData(presetList, this)
			this.presetDefinitionScreen = getScreenFormatData(screenFilterLiter, this)
			// 根据屏幕生成图层
			this.presetDefinitionLayer = getLayerFormatData(screenFilterLiter, this)
			this.presetDefinitionSource = getSourceFormatData(sourceList, this)

			this.setPresetDefinitions({
				...getPresetDefinitions(this, screenFilterLiter),
				...this.presetDefinitionPreset,
				...this.presetDefinitionScreen,
				...this.presetDefinitionLayer,
				...this.presetDefinitionSource,
			})

			this.updateActions()
			this.updateFeedbacks()
		})
	}

	/** Switcher devices handle end */

	/** F devices handle start */
	//update device status
	updateDeviceStatus(isAlive) {
		this.log('debug', 'ping test:' + isAlive + ', lastState:' + this.lastState)
		if (isAlive == true) {
			this.log('debug', 'ping check ok.')
			if (this.lastState !== 0) {
				this.log('debug', 'connection recover, try to reconnect device.')
				this.updateStatus(InstanceStatus.Connecting)
				//try to reconnect
				this.initUDP()
				this.initTCP()
				this.lastState = 0
			}
		} else {
			if (isAlive == false && this.lastState === 0) {
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.log('debug', 'ping check failure.')
				this.lastState = 1
			}
		}
	}

	pingTest() {
		ping.sys.probe(this.config.host, (isAlive) => this.updateDeviceStatus(isAlive), { timeout: 1 })
	}

	initTCP() {
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		this.config.port = 5400

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.log('debug', `tcp-status-change, status: ${status}, msg: ${message}`)
				this.updateStatus(status, message)
			})

			this.socket.on('error', async (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.log('debug', 'TCP Network error: ' + err.message)
				this.updateStatus(InstanceStatus.Connecting)
				if (this.udp !== undefined) {
					let cmd_connect = Buffer.from([
						0x72, 0x65, 0x71, 0x4e, 0x4f, 0x56, 0x41, 0x53, 0x54, 0x41, 0x52, 0x5f, 0x4c, 0x49, 0x4e, 0x4b, 0x3a, 0x00,
						0x00, 0x03, 0xfe, 0xff,
					]) // Port FFFE
					try {
						await this.udp.send(cmd_connect)
					} catch (e) {
						this.log('debug', `UDP send Error.${e}`)
					}
				} else {
					this.initUDP()
				}
			})

			this.socket.on('connect', () => {
				let cmd = Buffer.from([
					0x55, 0xaa, 0x00, 0x00, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x00,
					0x57, 0x56,
				])
				this.socket.send(cmd)
				this.log('debug', 'TCP Connected')
				this.updateStatus(InstanceStatus.Ok)
			})

			// if we get any data, display it to stdout
			this.socket.on('data', (buffer) => {
				//future feedback can be added here
				// this.log('debug', 'Tcp recv:' + buffer);
			})
		} else {
			this.log('error', 'No host configured')
			this.updateStatus(InstanceStatus.BadConfig)
		}
	}

	async initUDP() {
		if (this.udp !== undefined) {
			this.udp.destroy()
			delete this.udp
		}

		if (this.config.host !== undefined) {
			this.udp = new UDPHelper(this.config.host, 3800)

			this.udp.on('error', (err) => {
				this.log('debug', 'UDP Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})

			// If we get data, thing should be good
			this.udp.on('data', () => {
				// this.status(this.STATE_WARNING, 'Connecting...')
			})

			this.udp.on('status_change', (status, message) => {
				this.log('debug', 'UDP status_change: ' + status)
			})
		} else {
			this.log('error', 'No host configured')
			this.updateStatus(InstanceStatus.BadConfig)
		}

		if (this.udp !== undefined) {
			let cmd_register = Buffer.from([
				0x72, 0x65, 0x71, 0x4e, 0x4f, 0x56, 0x41, 0x53, 0x54, 0x41, 0x52, 0x5f, 0x4c, 0x49, 0x4e, 0x4b, 0x3a, 0x00,
				0x00, 0x03, 0xfe, 0xff,
			])
			try {
				await this.udp.send(cmd_register)
			} catch (e) {
				this.log('debug', `UDP send error.${e}`)
			}
		}
	}
	/** F devices handle end */

	updateDefaultInfo() {
		LATCH_ACTIONS.map((item) => {
			delete this.config[item]
		})
		this.updateActions()
		this.updateFeedbacks()
		this.setPresetDefinitions(getPresetDefinitions(this))
		getVaraiableDefinitions(this)
	}

	async configUpdated(config) {
		this.log('debug', 'configUpdated modules...')
		this.updateStatus(InstanceStatus.Connecting)
		let resetConnection = false
		if (this.config.host !== config.host || this.config.modelId !== config.modelId) {
			resetConnection = true
		}
		this.screenSelect = {}
		this.layerSelect = -1
		this.presetStatus = {}
		this.specifiedScreenFtbStatus = {}
		this.specifiedScreenFreezeStatus = {}
		delete this.config.token
		delete this.config.sn
		this.config = {
			...this.config,
			...config,
			model: this.DEVICES_INFO[config.modelId],
		}
		this.updateDefaultInfo.bind(this)()
		// 删除心跳
		if (this.heartbeat) {
			clearInterval(this.heartbeat)
			delete this.heartbeat
		}
		if (this.presetBeat) {
			clearInterval(this.presetBeat)
			delete this.presetBeat
		}

		if (HTTP_DEVICES.includes(this.config.modelId)) {
			this.log('debug', 'http configUpdated handle...')
			this.log('debug', `this.config:${JSON.stringify(this.config)}`)
			if (this.socket !== undefined) {
				this.socket.destroy()
			}

			await this.getDevicesByUCenter()

			this.updateDefaultInfo.bind(this)()
		} else {
			const isRefresh = resetConnection === true || this.socket === undefined
			if (!isRefresh) return

			this.initUDP()
			this.initTCP()
			this.heartbeat = setInterval(() => this.pingTest(), 10000) //check every 10s

			this.updateDefaultInfo.bind(this)()
		}
	}

	async init(config) {
		this.updateStatus(InstanceStatus.Connecting)

		this.config = Object.assign({}, config)

		if (this.config.modelId !== undefined) {
			this.config.model = this.DEVICES_INFO[this.config.modelId]
		} else {
			this.config.modelId = this.DEVICES[0].id
			this.config.model = this.DEVICES[0]
		}

		// 初始化并再次更新设备恩协议及设备状态
		if (CMD_DEVICES.includes(this.config.modelId)) {
			this.initUDP()
			this.initTCP()
			this.heartbeat = setInterval(() => this.pingTest(), 10000) //check every 10s
		} else if (HTTP_DEVICES.includes(this.config.modelId)) {
			await this.getDevicesByUCenter()
		}

		this.updateDefaultInfo.bind(this)()
	}
}

runEntrypoint(ModuleInstance, upgradeScripts)
