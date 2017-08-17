
/**
 * Server Configuration
 */

module.exports = {
	server: {
		url: 'http://disqus.wangzhechao.com',		/* 指定该系统绑定域名（外网可访问） */
	    host: '127.0.0.1',
	    port: '3000',

	    compress: true,
	    proxy: true,
	    memoryStore: true
	},


	cookie: {
		secret: 'gfw-disqus',
		key: 'gfw-disqus-cookie'
	},


	disqus: {
		/* 管理员邮箱 */
		admin_email: 'wangzhechao@live.com',

		/* 管理员用户名 */
		admin_name: 'W_Z_C',

		/* disqus forum id */
		forum_id: 'wangzhechao',

		/* 授权网站 （跨域） */
		auth_website: '*',
		
		/* 公有key，为了提交匿名评论，无需修改 */
		pub_key: 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F',

		/* disqus授权 */
		api_key: '',
		api_secret: '',
		access_token: '',

		api_url: 'https://disqus.com/api',
		api_ver: '3.0',
		output_type: 'json',

		auto_approve: true	/* 是否自动授权 */
	},

	gravatar_cdn: '//cn.gravatar.com/avatar',

	logging: false
};