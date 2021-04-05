const CoreBase = require('../Core/Base')

/**
 * Abstract class providing base functionality for services.
 *
 * @extends CoreBase
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 * @since 2.3.0
 * @abstract
 * @copyright 2021 Bitfocus AS
 * @license
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for Companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 */
class ServiceBase extends CoreBase {
	/**
	 * Create the core base object.  This needs to be called in the extending class
	 * using <code>super(registry, 'module_name')</code>.
	 * @param {Registry} registry - the core registry
	 * @param {string} logSource - module name to be used in UI logs
	 * @param {Object} defaults - default values for related system settings
	 * @param {string} defaultItem - the key for the userconfig that sets if the module is enabled or disabled
	 */
	constructor(registry, logSource, defaults, defaultItem) {
		super(registry, logSource)

		this.initialized = false
		this.currentState = false
		this.defaultItem = defaultItem

		this.setDefaults(defaults)
		this.setCheckEnabled()
	}

	/**
	 * Kill the socket, if exists.
	 */
	disableModule() {
		if (this.socket) {
			try {
				this.currentState = false
				this.log('debug', 'Stopped listening on port ' + this.port)
				this.socket.close()
				delete this.socket
			} catch (e) {}
		}
	}

	/**
	 * Call to enable the socket if the module is initialized.
	 */
	enableModule() {
		if (this.initialized === true) {
			try {
				this.listen()
			} catch (e) {
				console.log('Error listening for ${this.logSource}', e)
			}
		}
	}

	/**
	 * Process a socket error and disable the module.
	 * @param {Error} e - the error
	 */
	handleSocketError(e) {
		let message

		switch (e.code) {
			case 'EADDRINUSE':
				message = `Port ${this.port} already in use.`
				break
			case 'EACCES':
				message = `Access to port ${this.port} denied.`
				break
			default:
				message = `Could not open socket on port ${this.port}: ${e.code}`
		}

		this.log('error', message)
		this.disableModule()
	}

	/**
	 * Initialize and enable the socket if defaults allow.
	 */
	init() {
		this.initialized = true

		if (
			this.defaultItem === undefined ||
			(this.defaultItem !== undefined && this.userconfig().getKey(this.defaultItem) === true)
		) {
			this.enableModule()
		}
	}

	/**
	 * Check the userconfig for the module's settings and set the defaults if necessary.
	 * @param {Object} defaults - the default key/value userconfig values
	 */
	setDefaults(defaults) {
		const config = this.userconfig().get()

		if (defaults !== undefined && typeof defaults == 'object') {
			for (let key in defaults) {
				if (config[key] === undefined) {
					this.userconfig().setKey(key, defaults[key])
				}
			}
		}
	}

	/**
	 * Process an update userconfig value and enable/disable the module, if necessary.
	 * @param {string} key - the saved key
	 * @param {(boolean|number|string)} value - the saved value
	 */
	updateUserconfig(key, value) {
		if (this.defaultItem !== undefined) {
			if (key == this.defaultItem) {
				if (this.currentState == false && value == true) {
					this.enableModule()
				} else if (this.currentState == true && value == false) {
					this.disableModule()
				}
			}
		}
	}
}

exports = module.exports = ServiceBase