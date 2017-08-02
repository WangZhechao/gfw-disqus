var Promise = require('bluebird'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils');

module.exports = {
	browse: function() {
		return Promise.resolve({
			view: 'comment.ejs',
			locals: {title: 'SHP测试主页！'}
		});
	},


	create: function(params) {

		var body = {
		    api_key: config.disqus.pub_key,
		    thread: params.thread,
		    parent: params.parent || null,
		    message: params.message,

		    author_name: params.name,
		    author_email: params.email,
		    author_url: params.url || null,
		};


		var valids = [{
			value: body.thread,
			name: 'thread',
			valids: ['required']
		}, {
			value: body.message,
			name: '评论内容',
			valids: ['required']
		}, {
			value: body.author_name,
			name: '名称',
			valids: ['required']
		}, {
			value: body.author_email,
			name: '邮箱',
			valids: ['required']
		}]


		return utils.validate(valids)().then(function() {
			var options = {
			    method: 'POST',
			    uri: utils.getDisqusURL('posts_create'),
			    form: body,
			    json: true // Automatically stringifies the body to JSON
			};

			return Promise.resolve(options);
		}).then(function(opts) {
			return rp(opts);
		}).then(function(parsedBody) {
			if(parsedBody.code == 0 && parsedBody.response) {
				var id = parsedBody.response.id;

				return rp({
				    method: 'POST',
				    uri: utils.getDisqusURL('posts_approve'),
				    form: {
				    	api_key: config.disqus.pub_key,
				    	access_token: 'c00bf6bfa7474652ae026e3de4afce59',
				    	api_secret : 'uJjT8rXI0zixeXAykYSS26HTsYikEZrVb0PCQuD4lZn7NQ7NL1hW2RfDGW2TSWU2',
				    	post: id
				    },
				    json: true // Automatically stringifies the body to JSON
				});

			} else {
				return errors.logAndRejectError('生成评论内容失败');
			}
		}).then(function(resp) {
			console.log(resp);
		}).catch(function(err) {
			return errors.disqusRequestError(err);
		});
	}
};