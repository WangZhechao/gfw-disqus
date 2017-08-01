
/**
 * Server Configuration
 */

module.exports = {
	server: {
		url: 'http://127.0.0.1:3000',
	    host: '127.0.0.1',
	    port: '3000',

	    compress: true,
	    proxy: false,
	    memoryStore: true
	},


	cookie: {
		secret: 'plus',
		key: 'plus-cookie'
	},


	disqus: {
		forum_id: 'fooleap',
		auth_website: 'http://wangzhechao.com',
		api_key: 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F',

		api_url: 'https://disqus.com/api',
		api_ver: '3.0',
		output_type: 'json',

		resources: {
			'threads_details': 'threads/details',
			'threads_listPosts': 'threads/listPosts'
		}
	},

	gravatar_cdn: '//cn.gravatar.com/avatar',
	emoji_path: 'https://assets-cdn.github.com/images/icons/emoji/unicode',

	logging: true
};