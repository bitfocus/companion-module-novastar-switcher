import got from 'got'

// 获取token
export const getToken = async (url, obj) => {
	const res = await got.post(`${url}/v1/system/auth/login`, {
		https: {
			rejectUnauthorized: false,
		},
		json: obj,
	})
	const resData = JSON.parse(res.body)
	instance.log('info', 'token:')
	instance.log('info', res.body)
	return resData
}

export const getActions = function (instance) {
	let actions = {}

	const loginObj = {
		username: instance.config.username,
		password: instance.config.password,
	}

	actions['take'] = {
		name: 'TAKE',
		options: [],
		callback: async (event) => {
			try {
				instance.log('info','take action:')
				instance.log('info',instance.config.baseURL)
				const res = await getToken(instance.config.baseURL, loginObj)
				const token = res.code === 0 ? res.data.token : ''
				const obj = {
					direction: 0,
					effectSelect: 0,
					switchEffect: {
						time: 500,
						type: 1,
					},
				}
				await got.put(`${instance.config.baseURL}/v1/screen/selected/take`, {
					headers: {
						Authorization: token,
					},
					https: {
						rejectUnauthorized: false,
					},
					json: obj,
				})
			} catch (error) {
				instance.log('error', 'take send error')
			}
		},
	}

	actions['cut'] = {
		name: 'CUT',
		options: [],
		callback: async (event) => {
			try {				
				instance.log('info','cut action:')
				instance.log('info',instance.config.baseURL)
				const res = await getToken(instance.config.baseURL, loginObj)
				const token = res.code === 0 ? res.data.token : ''
				const obj = {
					direction: 0,
				}
				await got.put(`${instance.config.baseURL}/v1/screen/selected/cut`, {
					headers: {
						Authorization: token,
					},
					https: {
						rejectUnauthorized: false,
					},
					json: obj,
				})
			} catch (error) {
				instance.log('error', 'cut send error')
			}
		},
	}

	actions['ftb'] = {
		name: 'FTB',
		options: [
			{
				type: 'dropdown',
				name: 'FTB',
				id: 'ftb',
				default: '1',
				choices: instance.CHOICES_FTB,
			},
		],
		callback: async (event) => {
			try {
				instance.log('info','ftb action:')
				instance.log('info',instance.config.baseURL)
				const res = await getToken(instance.config.baseURL, loginObj)
				const token = res.code === 0 ? res.data.token : ''
				const obj = {
					ftb: {
						enable: Number(event.options.ftb),
						time: 700,
					},
				}
				await got.put(`${instance.config.baseURL}/v1/screen/selected/ftb`, {
					headers: {
						Authorization: token,
					},
					https: {
						rejectUnauthorized: false,
					},
					json: obj,
				})
			} catch (error) {
				instance.log('error', 'FTB send error')
			}
		},
	}

	actions['freeze'] = {
		name: 'FRZ',
		options: [
			{
				type: 'dropdown',
				name: 'FRZ',
				id: 'freeze',
				default: '1',
				choices: instance.CHOICES_FRZ,
			},
		],
		callback: async (event) => {
			try {
				instance.log('info','freeze action:')
				instance.log('info',instance.config.baseURL)
				const res = await getToken(instance.config.baseURL, loginObj)
				const token = res.code === 0 ? res.data.token : ''
				const obj = {
					freeze: Number(event.options.freeze),
				}
				await got.put(`${instance.config.baseURL}/v1/screen/selected/freeze`, {
					headers: {
						Authorization: token,
					},
					https: {
						rejectUnauthorized: false,
					},
					json: obj,
				})
			} catch (error) {
				instance.log('error', 'FRZ send error')
			}
		},
	}

	actions['preset'] = {
		name: 'Preset',
		options: [
			{
				type: 'dropdown',
				name: 'Preset',
				id: 'preset',
				default: '1',
				choices: [
					...Array(
						[instance.DEVICES_INFO.q8.id, instance.DEVICES_INFO.d32.id].includes(instance.config.modelId) ? 1024 : 128
					),
				].map((_, index) => ({
					id: index + 1,
					label: `Preset ${index + 1}`,
				})),
			},
		],
		callback: async (event) => {
			try {
				instance.log('info','preset action:')
				instance.log('info',instance.config.baseURL)
				const res = await getToken(instance.config.baseURL, loginObj)
				const token = res.code === 0 ? res.data.token : ''
				const obj = {
					sceneType: 0,
					id: Number(event.options.preset - 1),
					presetId: 0,
				}
				await got.put(`${instance.config.baseURL}/v1/preset/play`, {
					headers: {
						Authorization: token,
					},
					https: {
						rejectUnauthorized: false,
					},
					json: obj,
				})
			} catch (error) {
				instance.log('error', 'preset send error')
			}
		},
	}

	return actions
}
