var Promise = require('bluebird'),
	rp = require('request-promise'),
	_ = require('lodash'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils'),
	common = require('../common');



module.exports = {
	create: function(params) {

		//创建评论
		return D.posts.create(params)
		.then(function(create_resp) {
			if(!(create_resp.code === 0 && create_resp.response)) {
				return errors.logAndRejectError('生成评论内容失败');
			}

			var post = create_resp.response;

			//无需授权
			if(!config.disqus.auto_approve) {
				return Promise.resolve({
					success: true,
					post: common.formatPost(post)
				});
			}


			//授权评论
			return D.posts.approve(
				_.assign(params, {post: post.id})
			).then(function(approve_resp) {
				if(approve_resp.code !== 0) {
					console.log('授权失败！请在disqus后台设置管理员权限', approve_resp);
				}

				return Promise.resolve({
					success: true,
					data: common.formatPost(post)
				});							
			});
		}).catch(function(err) {
			console.log(err);
			return errors.disqusRequestError(err);
		});
	},


	list: function(params) {

		//获取Thread信息
		return Promise.resolve(params).then(function(params) {
			return D.threads.details(params).catch(function(e) {
				//自动创建Thread
				if(e.statusCode === 400 && e.error && 
					e.error.code === 2 && e.error.response && 
					-1 !== e.error.response.search('Unable to find thread'))
				{
					return D.threads.create(params);
				}

				throw e;
			});
		}).then(function(threads_details) {
			return Promise.resolve(_.pick(threads_details.response, ['likes', 'isClosed', 'slug', 'id', 'posts']));
		}).then(function(thread) {

	    	//可以优化，当没有评论的时候
	    	if(thread.posts === 0) {
	    		thread.postTotal = 0;
	    		thread.posts = [];
	    		thread.cursor = {
		    		prev: null,
		    		hasNext: false,
		    		next: '0:0:0',
		    		hasPrev: false,
		    		total: null,
		    		id: '0:0:0',
		    		more: false
	    		};

	    		return Promise.resolve({
	    			success: true,
	    			data: thread
	    		});
	    	}


	    	//获取列表
	    	return D.threads.listPosts(
	    		_.assign({
	    			cursor: params.cursor
	    		}, {
	    			thread: thread.id
	    		})
	    	).then(function(thread_list) {
	    		thread.postTotal = thread.posts;

	    		thread.posts = [];
	    		_.forEach(thread_list.response, function(post) {
	    			thread.posts.push(common.formatPost(post));
	    		});

	    		thread.cursor = thread_list.cursor;

				return Promise.resolve({success: true, data: thread});	    		
	    	});
		}).catch(function (err) {
	    	return errors.disqusRequestError(err);
	    });

	}
};