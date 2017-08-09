
/**
 * Server Configuration
 */

module.exports = {
	server: {
		url: 'http://disqus.wangzhechao.com',
	    host: '127.0.0.1',
	    port: '3000',

	    compress: true,
	    proxy: false,
	    memoryStore: true
	},


	cookie: {
		secret: 'gfw-disqus',
		key: 'gfw-disqus-cookie'
	},


	disqus: {
		admin_email: 'wangzhechao@live.com',
		admin_name: 'W_Z_C',
		forum_id: 'wangzhechao',
		auth_website: ['http://wangzhechao.com', 'http://127.0.0.1:2368'],
		pub_key: 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F',
		api_key: 'Nc7AR12AlsLGDJXlhBU3FAerFEriT4fcPb2RMJmdqBcqvc0n9XgfKxm9zjetd2N6',
		api_secret: 'uJjT8rXI0zixeXAykYSS26HTsYikEZrVb0PCQuD4lZn7NQ7NL1hW2RfDGW2TSWU2',
		access_token: 'c00bf6bfa7474652ae026e3de4afce59',

		api_url: 'https://disqus.com/api',
		api_ver: '3.0',
		output_type: 'json',


		auto_approve: true,

		resources: {
			'threads_details': 'threads/details',
			'threads_listPosts': 'threads/listPosts',
			'posts_create': 'posts/create',
			'posts_approve': 'posts/approve'
		}
	},

	gravatar_cdn: '//cn.gravatar.com/avatar',
	emoji_path: 'https://assets-cdn.github.com/images/icons/emoji/unicode',

	logging: true
};