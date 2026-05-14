import got, { Method, OptionsOfJSONResponseBody } from 'got'

/** Headers expected by UCenter / device gateway (same as legacy module). */
export type UCenterRequestHeaders = {
	ip: string
	port: number | string
	protocol: string
}

export class HttpClient {
	private host: string
	private unicoPort: number
	private token: string | null = null
	private ucenterHeaders: UCenterRequestHeaders | null = null

	constructor(host: string, unicoPort: number) {
		this.host = host
		this.unicoPort = unicoPort
	}

	setUCenterHeaders(headers: UCenterRequestHeaders): void {
		this.ucenterHeaders = headers
	}

	setToken(token: string): void {
		this.token = token
	}

	private async request<T = any>(
		method: Method,
		path: string,
		options: Partial<OptionsOfJSONResponseBody> = {},
	): Promise<T> {
		// Align with legacy: REST goes through TLS on discovery port (e.g. 19998), not device HTTP API port.
		const url = `https://${this.host}:${this.unicoPort}${path}`

		const headers = {
			...(this.ucenterHeaders
				? {
						ip: this.ucenterHeaders.ip,
						port: String(this.ucenterHeaders.port),
						protocol: this.ucenterHeaders.protocol,
					}
				: {}),
			...(this.token ? { Authorization: this.token } : {}),
			...options.headers,
		}

		return got(url, {
			method,
			...options,
			headers,
			https: {
				rejectUnauthorized: false,
			},
		}).json<T>()
	}

	async get<T = any>(path: string): Promise<T> {
		return this.request<T>('GET', path)
	}

	async post<T = any, B = Record<string, unknown>>(path: string, json: B): Promise<T> {
		return this.request<T>('POST', path, { json })
	}

	async put<T = any, B = Record<string, unknown>>(path: string, json: B): Promise<T> {
		return this.request<T>('PUT', path, { json })
	}
}
