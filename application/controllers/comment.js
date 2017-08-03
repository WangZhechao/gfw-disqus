var Promise = require('bluebird'),
	rp = require('request-promise'),
	_ = require('lodash'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils'),
	common = require('../common');



module.exports = {
	browse: function() {
		return Promise.resolve({
			view: 'comment.ejs',
			locals: {title: 'SHP测试主页！'}
		});
	},


	create: function(params) {

		//如果是管理员发送直接授权？？？

		//假冒管理员怎么办？？？

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
			return rp(opts);	//创建评论
		}).then(function(parsedBody) {
			if(parsedBody.code == 0 && parsedBody.response) {
				var id = parsedBody.response.id;

				//无需授权
				if(!config.disqus.auto_approve) {
					return Promise.resolve({
						success: true,
						post: common.formatPost(parsedBody.response)
					});
				}


				//自动授权评论
				return rp({
				    method: 'POST',
				    uri: utils.getDisqusURL('posts_approve'),
				    form: {
				    	access_token: config.disqus.access_token,
				    	api_secret : config.disqus.api_secret,
				    	post: id
				    },
				    json: true // Automatically stringifies the body to JSON
				}).then(function(resp) {

					if(response.code != 0) {
						console.log('授权失败！请在disqus后台设置管理员权限', resp);
					}

					return Promise.resolve({
						success: true,
						post: common.formatPost(parsedBody.response)
					});
				});

			} else {
				return errors.logAndRejectError('生成评论内容失败');
			}
		}).catch(function(err) {
			return errors.disqusRequestError(err);
		});
	}
};