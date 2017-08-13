var Promise = require('bluebird'),
    errors = require('../../lib/errors');


module.exports = {
	browse: function() {

		//DB

		return Promise.resolve({
			view: 'home.ejs',
			locals: {title: 'disqus测试主页！', pid: process.pid}
		});
	}
};
