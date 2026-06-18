import type { Preset } from '../interfaces/Preset.js'
import type { Screen } from '../interfaces/Screen.js'

function isNonEmptyTrimmedString(value: unknown): boolean {
	return typeof value === 'string' && value.trim() !== ''
}

/** Treat screen as invalid when guid, name, etc. are blank strings (device may occasionally inject placeholder entries) */
export function isValidScreen(screen: Screen): boolean {
	return isNonEmptyTrimmedString(screen.guid) && screen.general != null && isNonEmptyTrimmedString(screen.general.name)
}

export function filterValidScreens(list: Screen[]): Screen[] {
	return list.filter(isValidScreen)
}

/** Treat preset as invalid when guid or name is blank; also sanitize nested screens */
export function isValidPreset(preset: Preset): boolean {
	return isNonEmptyTrimmedString(preset.guid) && isNonEmptyTrimmedString(preset.name)
}

export function filterValidPresets(list: Preset[]): Preset[] {
	return list.filter(isValidPreset).map((preset) => ({
		...preset,
		screens: filterValidScreens(preset.screens ?? []),
	}))
}
