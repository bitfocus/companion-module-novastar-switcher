import { ModelKey } from '../config/modelMap.js'
import { N10 } from './devices/N10.js'
import { N20 } from './devices/N20.js'
import { D32 } from './devices/D32.js'

export interface MachineConfig {
	protocol: 'http' | 'https'
	apiPortStrategy: 'fromDeviceListHttpProtocol' | 'fixed'
	fixedApiPort?: number
	discovery: {
		protocol: 'http' | 'https'
		port: number
		httpsRejectUnauthorized?: boolean
	}
	basePath: string
	/** All endpoints that may vary by model/firmware */
	endpoints: {
		screen: {
			take: string
			cut: string
			ftb: string
			freeze: string
			select: string
			listDetail: string
			testPattern: string
		}
		preset: {
			list: string
			apply: string
		}
		layers: {
			source: string
			listDetail: string
			zorder: string
			window: string
			umd: string
			layerPresetListDetail: string
			layerPresetApply: string
			interfaces: string
			cropSource: string
		}
		crtl: {
			sourceBackup: string
		}
	}
}

export const MACHINE_CONFIGS: Record<ModelKey, MachineConfig> = {
	N10,
	N20,
	D32,
}
