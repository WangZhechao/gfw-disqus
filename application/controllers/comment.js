var Promise = require('bluebird'),
	_ = require('lodash'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config');


var getDisqusURL = function(path) {
	return config.disqus.api_url + '/' + config.disqus.api_ver + '/' 
		+ config.disqus.resources[path] + '.' + config.disqus.output_type;
}


module.exports = {

	list: function(params) {

		var qs = {
		    api_key: config.disqus.api_key,
		    forum: config.disqus.forum_id
		};


		var tqs = {};
		if(params.url) {
			tqs['thread:link'] = params.url;
		} else if(params.identifier) {
			tqs['thread:ident'] = params.identifier;
		} else {
			return errors.disqusRequestError('请传入查询参数！[请查看网页中disqus_config变量是否配置成功]');
		}



		return rp({
			uri: getDisqusURL('threads_details'),
			qs: _.assign(qs, tqs),

			json: true			
		}).then(function (res) {
			return Promise.resolve(_.pick(res.response, ['likes', 'isClosed', 'slug', 'id']));
	    }).then(function(thread) {
	    	return rp({
	    		uri: getDisqusURL('threads_listPosts'),
	    		qs: _.assign(qs, {thread: thread.id}),

	    		json: true
	    	}).then(function(res) {
	    		thread.posts = [];
	    		_.forEach(res.response, function(obj) {
	    		  	var post = _.pick(obj, ['dislikes', 'likes', 'message', 'createdAt', 'id', 'media', 'parent']);
	    			var author = _.pick(obj.author, ['isAnonymous', 'name', 'url']);

	    			thread.posts.push(_.assign(post, author));
	    		});

	    		thread.cursor = res.cursor || {more: false};

				return Promise.resolve(thread);
	    	});
	    }).catch(function (err) {
	    	return errors.disqusRequestError(err);
	    });
	}	

};