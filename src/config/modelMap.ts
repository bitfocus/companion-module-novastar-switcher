export type ModelKey = 'N10' | 'N20' | 'D32'

/**
 * discovery `modelId` -> model. IDs follow the same convention as Pixelhue platform firmware.
 */
export const MODEL_ID_TO_KEY: Record<number, ModelKey> = {
	28945: 'N10',
	28944: 'N20',
	30006: 'D32',
}
