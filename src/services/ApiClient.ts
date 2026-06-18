import got from 'got'
import { generateToken } from '../utils/utils.js'
import { ModuleInstance } from '../main.js'
import { Screen, ScreenListDetailData } from '../interfaces/Screen.js'
import { Preset, PresetListDetailData } from '../interfaces/Preset.js'
import { Response } from '../interfaces/Response.js'
import { Layer, LayerBounds, LayerListDetailData, LayerUMD } from '../interfaces/Layer.js'
import { HttpClient, UCenterRequestHeaders } from './HttpClient.js'

/** Same as legacy: fixed IP header required by server-side token validation. */
const UCENTER_HEADER_IP = '127.0.0.1'
import { LayerPreset, LayerPresetListDetailData } from '../interfaces/LayerPreset.js'
import { Interface, InterfacesListDetailData } from '../interfaces/Interface.js'
import { CropSource, CropSourcesListDetailData } from '../interfaces/CropSource.js'
import { MODEL_ID_TO_KEY, ModelKey } from '../config/modelMap.js'
import { MACHINE_CONFIGS, MachineConfig } from '../config/machineConfig.js'
import { SourceBackup } from '../interfaces/SourceBackup.js'
import { TestPatternPayload } from '../interfaces/TestPattern.js'
import { filterValidScreens } from '../utils/listFilters.js'

type CreateOptions = {
	model?: ModelKey
	overrides?: Partial<Record<ModelKey, Partial<MachineConfig>>>
	targetSn?: string
	includeClientType?: boolean
}

export class ApiClient {
	http: HttpClient | null = null
	host: string | null = null
	apiPort: number | null = null
	unicoPort = 19998

	token: string | null = null
	private ucenterHeaders!: UCenterRequestHeaders
	private cfg!: MachineConfig

	private constructor() {}

	static async create(instance: ModuleInstance, host: string, opts: CreateOptions = {}): Promise<ApiClient> {
		const client = new ApiClient()
		client.host = host
		await client.setup(instance, opts)
		return client
	}

	private pickConfig(model: ModelKey, overrides?: CreateOptions['overrides']): MachineConfig {
		const base = MACHINE_CONFIGS[model]
		const patch = overrides?.[model]
		return {
			...base,
			...patch,
			discovery: { ...base.discovery, ...patch?.discovery },
			endpoints: {
				...base.endpoints,
				...patch?.endpoints,
				screen: { ...base.endpoints.screen, ...patch?.endpoints?.screen },
				preset: { ...base.endpoints.preset, ...patch?.endpoints?.preset },
				layers: { ...base.endpoints.layers, ...patch?.endpoints?.layers },
			},
		}
	}

	async setup(instance: ModuleInstance, opts: CreateOptions): Promise<void> {
		const discovery = await this._getDeviceList(opts.includeClientType ?? false)
		const list = discovery?.data?.list ?? []

		const device = opts.targetSn ? list.find((d: any) => d.SN === opts.targetSn) : list[0]

		const httpProto = device.protocols?.find((p: any) => p.linkType === 'http')
		if (!httpProto?.port) throw new Error('HTTP protocol/port not found in discovery response.')

		this.apiPort = httpProto.port

		const modelFromId = MODEL_ID_TO_KEY[device.modelId as number] as ModelKey | undefined
		const selectedModel: ModelKey = opts.model ?? modelFromId ?? 'N10'
		instance.log('debug', `Using model: ${selectedModel}`)

		const isVirtual = device.SN.startsWith('virtual')
		if (isVirtual) {
			this.cfg = this.pickConfig('N10', opts.overrides)
			instance.log('debug', `Switching to virtual using model: N10`)
		} else {
			this.cfg = this.pickConfig(selectedModel, opts.overrides)
		}

		this.unicoPort = this.cfg.discovery.port // keep in sync if needed
		this.ucenterHeaders = {
			ip: UCENTER_HEADER_IP,
			port: httpProto.port,
			protocol: httpProto.linkType as string,
		}
		this.http = new HttpClient(this.host!, this.unicoPort)
		this.http.setUCenterHeaders(this.ucenterHeaders)
		instance.log('debug', `Using config: ${JSON.stringify(this.cfg)}`)

		const openDetail = await this._getDeviceOpenDetail()
		instance.log('debug', `Open Detail response: ${JSON.stringify(openDetail)}`)
		const serialNumber = openDetail.data.sn
		const startTime = openDetail.data.startTime
		instance.deviceSn = serialNumber
		this.token = generateToken(serialNumber, startTime)
		this.http.setToken(this.token)

		instance.log('debug', 'Get Screens')
		const screenResponse = await this.getScreens()
		instance.log('debug', 'Get Presets')
		const presetResponse = await this.getPresets()
		instance.log('debug', 'Get Layers')
		const layerResponse = await this.getLayers()
		instance.log('debug', 'Get Layer Presets')
		const layerPresetsResponse = await this.getLayerPresets()
		instance.log('debug', 'Get Interfaces')
		const interfacesResponse = await this.getInterfaces()
		instance.log('debug', 'Get Crop Sources')
		const cropSourcesResponse = await this.getCropSources()
		instance.log('debug', 'Get Backup Sources')
		const backupSourceResponse = await this.getBackupSource()
		instance.screens = screenResponse.data.list
		instance.presets = presetResponse.data.list
		instance.layers = layerResponse.data.list
		instance.layerPresets = layerPresetsResponse.data.list
		instance.interfaces = interfacesResponse.data.list
		instance.cropSources = cropSourcesResponse.data.list
		instance.sourceBackups = backupSourceResponse.data
	}

	async _getDeviceList(includeClientType: boolean = false): Promise<any> {
		const url = includeClientType
			? `https://${this.host}:${this.unicoPort}/unico/v1/ucenter/device-list?clientType=0`
			: `https://${this.host}:${this.unicoPort}/unico/v1/ucenter/device-list`
		return got
			.get(url, {
				https: {
					rejectUnauthorized: false,
				},
			})
			.json()
	}

	async _getDeviceOpenDetail(): Promise<any> {
		const url = `https://${this.host}:${this.unicoPort}/unico/v1/node/open-detail`
		return got
			.get(url, {
				https: {
					rejectUnauthorized: false,
				},
				headers: {
					ip: this.ucenterHeaders.ip,
					port: String(this.ucenterHeaders.port),
					protocol: this.ucenterHeaders.protocol,
					Accept: '*/*',
					Connection: 'keep-alive',
					'Content-Type': 'application/json',
				},
			})
			.json()
	}

	async take(screens: Screen[], swap: boolean = true, customEffect: boolean = false, time: number = 500): Promise<any> {
		const body = screens.map((screen) => ({
			direction: 0,
			effectSelect: customEffect ? 1 : 0,
			screenGuid: screen.guid,
			screenId: screen.screenId,
			screenName: screen.general.name,
			swapEnable: swap ? 1 : 0,
			switchEffect: { type: 1, time },
		}))

		return this.http!.put(this.cfg.endpoints.screen.take, body)
	}

	async cut(screens: Screen[], direction: number = 0, swap: boolean = true): Promise<any> {
		const body = screens.map((screen) => ({
			direction: +direction || 0,
			screenId: screen.screenId,
			swapEnable: swap ? 1 : 0,
		}))

		return this.http!.put(this.cfg.endpoints.screen.cut, body)
	}

	async ftb(screens: Screen[], enable: boolean, time: number): Promise<any> {
		const body = screens.map((screen) => {
			let ftb = 1
			if (global) {
				ftb = enable ? 1 : 0
			} else {
				ftb = screen.ftb.enable === 1 ? 0 : 1
			}

			return {
				screenId: screen.screenId,
				ftb: {
					enable: ftb,
					time,
				},
			}
		})

		console.log('debug', `FTB Body: ${JSON.stringify(body)}`)

		return this.http!.put(this.cfg.endpoints.screen.ftb, body)
	}

	async freeze(screens: Screen[], enable: boolean | null): Promise<any> {
		const body = screens.map((screen) => {
			const global = enable !== null

			let freeze = 1
			if (global) {
				freeze = enable ? 1 : 0
			} else {
				freeze = screen.freeze === 1 ? 0 : 1
			}

			return {
				screenId: screen.screenId,
				freeze,
			}
		})

		return this.http!.put(this.cfg.endpoints.screen.freeze, body)
	}

	async selectScreens(screens: Screen[]): Promise<any> {
		const body = screens.map((screen) => ({
			screenId: screen.screenId,
			select: screen.select,
			screenName: screen.general.name,
		}))
		return this.http!.put(this.cfg.endpoints.screen.select, body)
	}

	async loadPreset(preset: Preset, targetRegion: number): Promise<any> {
		const body = {
			auxiliary: {
				keyFrame: { enable: 1 },
				switchEffect: { type: 1, time: 500 },
				swapEnable: 1,
				effect: { enable: 1 },
			},
			serial: preset.serial,
			targetRegion,
			presetId: preset.guid,
		}

		return this.http!.post(this.cfg.endpoints.preset.apply, body)
	}

	async selectLayer(layerId: number, otherLayers: Layer[]): Promise<any> {
		const body = [
			{ layerId, selected: 1 },
			...otherLayers.filter((layer) => layer.selected === 1).map((layer) => ({ layerId: layer.layerId, selected: 0 })),
		]
		return this.http!.put(this.cfg.endpoints.screen.select, body)
	}

	async bringSelectedTo(layerId: number, to: number): Promise<any> {
		const body = [{ layerId, zorder: { type: 1, para: to } }]
		return this.http!.put(this.cfg.endpoints.layers.zorder, body)
	}

	async applyLayerPreset(layerId: number, layerPreset: LayerPreset): Promise<any> {
		const body = [{ layerIds: [{ layerId }], layerPreset }]
		return this.http!.put(this.cfg.endpoints.layers.layerPresetApply, body)
	}

	async applyLayerBounds(layerId: number, bounds: LayerBounds): Promise<any> {
		const body = [{ layerId, window: bounds }]
		return this.http!.put(this.cfg.endpoints.layers.window, body)
	}

	async applyUMD(layerId: number, umd: LayerUMD[]): Promise<any> {
		const body = [{ layerId, UMD: umd }]
		return this.http!.put(this.cfg.endpoints.layers.umd, body)
	}

	async setInputOnLayer(layer: Layer, input: Interface): Promise<any> {
		const body = [
			{
				layerId: layer.layerId,
				source: {
					general: {
						sourceId: input.interfaceId,
						sourceType: input.auxiliaryInfo.connectorInfo.interfaceType,
						connectorType: input.auxiliaryInfo.connectorInfo.type,
					},
				},
			},
		]

		return this.http!.put(this.cfg.endpoints.layers.source, body)
	}

	async setCropSourceOnLayer(layer: Layer, cropSource: CropSource, mainSource?: Interface): Promise<any> {
		const connectorType = mainSource?.auxiliaryInfo.connectorInfo.type

		const body = [
			{
				layerId: layer.layerId,
				source: {
					general: {
						sourceId: cropSource.cropId,
						sourceType: 8,
						connectorType: connectorType,
					},
				},
			},
		]

		return this.http!.put(this.cfg.endpoints.layers.source, body)
	}

	async setTestPatternOnScreen(screen: Screen, payload: TestPatternPayload): Promise<any> {
		const body = [
			{
				screenId: screen.screenId,
				testPattern: payload,
			},
		]

		return this.http!.put(this.cfg.endpoints.screen.testPattern, body)
	}

	async getScreens(): Promise<Response<ScreenListDetailData>> {
		const res = await this.http!.get<Response<ScreenListDetailData>>(this.cfg.endpoints.screen.listDetail)
		const list = filterValidScreens(Array.isArray(res.data?.list) ? res.data.list : [])
		return {
			...res,
			data: {
				...res.data,
				list,
				totalCount: list.length,
			},
		}
	}

	async getPresets(): Promise<Response<PresetListDetailData>> {
		return this.http!.get(this.cfg.endpoints.preset.list)
	}

	async getLayers(): Promise<Response<LayerListDetailData>> {
		return this.http!.get(this.cfg.endpoints.layers.listDetail)
	}

	async getLayerPresets(): Promise<Response<LayerPresetListDetailData>> {
		return this.http!.get(this.cfg.endpoints.layers.layerPresetListDetail)
	}

	async getInterfaces(): Promise<Response<InterfacesListDetailData>> {
		return this.http!.get(this.cfg.endpoints.layers.interfaces)
	}

	async getCropSources(): Promise<Response<CropSourcesListDetailData>> {
		return this.http!.get(this.cfg.endpoints.layers.cropSource)
	}

	async getBackupSource(): Promise<Response<SourceBackup>> {
		return this.http!.get(this.cfg.endpoints.crtl.sourceBackup)
	}

	async setBackupSource(backupSource: SourceBackup): Promise<any> {
		return this.http!.put(this.cfg.endpoints.crtl.sourceBackup, backupSource)
	}
}
