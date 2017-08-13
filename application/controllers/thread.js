var Promise = require('bluebird'),
	_ = require('lodash'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils'),
	common = require('../common');


module.exports = {

	create: function(params) {

		var body = {
			access_token: config.disqus.access_token,
			api_secret : config.disqus.api_secret,
			forum: config.disqus.forum_id
		};


		if(params.link) {
			body['url'] = params.link;
		} else if(params.ident) {
			body['identifier'] = params.ident;
		} else {
			return errors.disqusRequestError('请传入查询参数！[请查看网页中disqus_config变量是否配置成功]');
		}


		if(params.title) {
			body['title'] = params.title || '';
		}
		else {
			return errors.disqusRequestError('请传入创建Thread相应的参数');
		}

		return rp({
		    method: 'POST',
		    uri: utils.getDisqusURL('threads_create'),
		    form: body,
		    json: true // Automatically stringifies the body to JSON
		});
	}
};