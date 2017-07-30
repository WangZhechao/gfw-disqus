var Promise = require('bluebird');

module.exports = {
	browse: function() {
		return Promise.resolve({
			view: 'comment.ejs',
			locals: {title: 'SHP测试主页！'}
		});
	}	
};