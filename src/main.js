import { InstanceBase, InstanceStatus, Regex, runEntrypoint } from '@companion-module/base'

import { getToken, getActions } from './actions.js'
import { getPresetDefinitions } from './presets.js'

const PROTOCOL_TYPE = {
	http: { id: 'http', label: 'http' },
	https: { id: 'https', label: 'https' },
}

class NovaStarInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.PROTOCOL_TYPE = Object.values(PROTOCOL_TYPE)

		this.CHOICES_FTB = [
			{
				id: '0',
				label: 'No fade to black',
				default: 0,
			},
			{
				id: '1',
				label: 'Fade to black',
				default: 1,
			},
		]
		this.CHOICES_FRZ = [
			{
				id: '0',
				label: 'Unfreeze',
				default: 0,
			},
			{
				id: '1',
				label: 'Freeze',
				default: 1,
			},
		]
		this.DEVICES_INFO = {
			n10: { id: 'n10', label: 'NovaStar N10', ftb: this.CHOICES_FTB, freeze: this.CHOICES_FRZ },
			n20: { id: 'n20', label: 'NovaStar N20', ftb: this.CHOICES_FTB, freeze: this.CHOICES_FRZ },
			p10: { id: 'p10', label: 'Pixelhue P10', ftb: this.CHOICES_FTB, freeze: this.CHOICES_FRZ },
			p20: { id: 'p20', label: 'Pixelhue P20', ftb: this.CHOICES_FTB, freeze: this.CHOICES_FRZ },
			d32: { id: 'd32', label: 'NovaStar D32', ftb: this.CHOICES_FTB, freeze: this.CHOICES_FRZ },
			q8: { id: 'q8', label: 'Pixelhue Q8', ftb: this.CHOICES_FTB, freeze: this.CHOICES_FRZ },
		}
		this.DEVICES = Object.values(this.DEVICES_INFO)
	}

	updateActions() {
		this.log('debug', 'update actions....')
		this.setActionDefinitions(getActions(this))
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
				value: 'This module will allow you to control the following novastar products: N10, N20, P10, P20, D32 and Q8.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				width: 6,
				default: '192.168.0.10',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 6,
				default: '8088',
				regex: Regex.PORT,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 6,
				default: '',
				required: true,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
				default: '',
				required: true,
			},
			/*
			{
				type: 'dropdown',
				id: 'protocol',
				label: 'Protocol',
				width: 6,
				choices: this.PROTOCOL_TYPE,
				default: this.PROTOCOL_TYPE[0].id,
			},
			*/
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
		if (this.socket !== undefined) {
			this.socket.destroy()
		}
		this.log('destroy', this.id)
	}

	async configUpdated(config) {
		this.config = config
		await this.getProtocol()

		this.log('info', 'configUpdated module....')
	}

	init(config) {
		this.log('debug', 'init module config....')

		this.config = Object.assign({}, config)

		if (this.config.modelId !== undefined) {
			this.config.model = this.DEVICES_INFO[this.config.modelId]
		} else {
			this.config.modelId = this.DEVICES[0].id
			this.config.model = this.DEVICES[0]
		}

		this.updateActions()
		this.updateStatus(InstanceStatus.Connecting)
		this.setPresetDefinitions(getPresetDefinitions(this))

		this.configUpdated(config)
	}

	async getDeviceStatus() {
		this.config.baseURL = `${this.config.protocol}://${this.config.host}:${this.config.port}/unico`
		const res = await getToken(this.config.baseURL, {
			username: this.config.username,
			password: this.config.password,
		})
		if (res.code === 0) {
			this.updateStatus(InstanceStatus.Ok)
		} else if (res.code === 8274) {
			this.updateStatus(InstanceStatus.BadConfig)
		} else {
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}

	async getProtocol() {
		this.log('info', 'getProtocol')
		try {
			try {
				this.config.protocol = 'http'
				await this.getDeviceStatus()
			} catch (e) {
				this.config.protocol = 'https'
				await this.getDeviceStatus()
			}
		} catch (e) {
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}
}

runEntrypoint(NovaStarInstance, [])
