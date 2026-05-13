export type ModelKey = 'N10' | 'N20' | 'D32'

/**
 * discovery `modelId` -> 机型。编号与沿用 Pixelhue 平台固件侧约定一致；
 */
export const MODEL_ID_TO_KEY: Record<number, ModelKey> = {
	28945: 'N10',
	28944: 'N20',
	30006: 'D32',
}
