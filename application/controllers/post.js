var Promise = require('bluebird'),
	_ = require('lodash'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils'),
	common = require('../common');


module.exports = {

	list: function(params) {

		var page = {
			limit: 50,
		    order: 'asc'
		}

		if(params.cursor) {
			page.cursor = params.cursor;
		}


		var tqs = {};
		if(params.link) {
			tqs['thread:link'] = params.link;
		} else if(params.ident) {
			tqs['thread:ident'] = params.ident;
		} else {
			return errors.disqusRequestError('请传入查询参数！[请查看网页中disqus_config变量是否配置成功]');
		}


		return Promise.resolve(params).then(function(params) {
			return rp({
				uri: utils.getDisqusURL('threads_details'),
				qs: _.assign({
					api_key: config.disqus.api_key,
					forum: config.disqus.forum_id
				}, tqs),

				json: true			
			}).catch(function(e) {
				//自动创建
				if(e.statusCode === 400 && e.error
					&& e.error.code === 2 && e.error.response
					&& -1 !== e.error.response.search('Unable to find thread'))
				{
					return C.thread.create(params);
				}

				throw e;
			});

		}).then(function (res) {
			return Promise.resolve(_.pick(res.response, ['likes', 'isClosed', 'slug', 'id', 'posts']));
	    }).then(function(thread) {
	    	return rp({
	    		uri: utils.getDisqusURL('threads_listPosts'),
	    		qs: _.assign({
	    			access_token: config.disqus.access_token,
	    			api_secret : config.disqus.api_secret,
	    			forum: config.disqus.forum_id
	    		}, page, {thread: thread.id}),

	    		json: true
	    	}).then(function(res) {
	    		thread.postTotal = thread.posts;

	    		thread.posts = [];
	    		_.forEach(res.response, function(post) {
	    			thread.posts.push(common.formatPost(post));
	    		});

	    		thread.cursor = res.cursor || {more: false};

				return Promise.resolve({success: true, data: thread});
	    	});
	    }).catch(function (err) {
	    	return errors.disqusRequestError(err);
	    });
	}
};