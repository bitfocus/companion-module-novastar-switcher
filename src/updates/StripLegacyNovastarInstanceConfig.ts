import type { CompanionStaticUpgradeResult, CompanionStaticUpgradeScript } from '@companion-module/base'
import { defaultConfig, type ModuleConfig } from '../config.js'

/**
 * 旧版 novastar-switcher（IP + 型号 modelId）升级为本项目与 pixelhue 一致的 host + 发现设备 deviceSn。
 * 清除已废弃字段，避免 Companion 仍按旧 schema 展示配置。
 */
export const stripLegacyNovastarInstanceConfig: CompanionStaticUpgradeScript<ModuleConfig> = (
	_context,
	props,
): CompanionStaticUpgradeResult<ModuleConfig> => {
	const empty: CompanionStaticUpgradeResult<ModuleConfig> = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const raw = props.config as (ModuleConfig & Record<string, unknown>) | null
	if (!raw) return empty

	const legacyKeys = ['modelId', 'modelID', 'model', 'presetType'] as const
	if (!legacyKeys.some((k) => k in raw)) return empty

	const host = typeof raw.host === 'string' && raw.host.trim() !== '' ? raw.host : defaultConfig().host
	const deviceSn = typeof raw.deviceSn === 'string' && raw.deviceSn !== '' ? raw.deviceSn : undefined

	return {
		updatedConfig: { host, deviceSn },
		updatedActions: [],
		updatedFeedbacks: [],
	}
}
