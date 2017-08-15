/**
 * Posts
 *
 * @author  W_Z_C
 * @date 2017年8月15日11:33:10
 */

var Promise = require('bluebird'),
	_ = require('lodash'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils'),
	common = require('../common');



module.exports = {

	/**
	 * Creates a new post.
	 */
	create: function(params) {

		var valids, body = {
		  	api_key: config.disqus.pub_key,

		    thread: params.thread,
		    parent: params.parent || null,
		    message: params.message,

		    author_name: params.name.trim(),
		    author_email: params.email.trim(),
		    author_url: params.url || null
		};


		valids = [{
			value: body.api_key,
			name: 'api_key',
			valids: ['required']
		}, {
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
		}];


		return utils.validate(valids)()
		.then(function() {

			//这里有个问题，如果匿名评论，不判断可能会导致冒充管理员
			//这里禁止发表管理员评论，同样会导致真的管理员无法发表评论的bug。
			//理论上需要登录通过session判断，这里直接简单禁止发表
			if(body.author_email.trim() == config.disqus.admin_email.trim() || 
				body.author_name.trim() == config.disqus.admin_name.trim()) {
				return errors.logAndRejectError('伪装管理员，已拉黑……');
			}


			return rp({
			    method: 'POST',
			    uri: utils.getDisqusURL('posts/create'),
			    form: body,
			    json: true // Automatically stringifies the body to JSON
			});
		});
	},


	/**
	 * Approves the requested post.
	 */
	approve: function(params) {
		var valids, body = {
			access_token: config.disqus.access_token,
			api_secret : config.disqus.api_secret,
			post: params.post
		};


		valids = [{
			value: body.access_token,
			name: 'access_token',
			valids: ['required']
		}, {
			value: body.api_secret,
			name: 'api_secret',
			valids: ['required']
		}, {
			value: body.post,
			name: 'Looks up a post by ID',
			valids: ['required']
		}];


		return utils.validate(valids)()
		.then(function() {
			return rp({
			    method: 'POST',
			    uri: utils.getDisqusURL('posts/approve'),
			    form: body,
			    json: true // Automatically stringifies the body to JSON
			});
		});
	}

};