
/**
 * Server Configuration
 */

module.exports = {
	server: {
	    host: '0.0.0.0',
	    port: '3000',

	    compress: true,
	    proxy: false,
	    memoryStore: true
	},

	cookie: {
		secret: 'plus',
		key: 'plus-cookie'
	},

	logging: true
};