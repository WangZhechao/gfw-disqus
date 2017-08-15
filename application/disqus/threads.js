/**
 * Threads 
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
	 * This method is currently under development and subject to change.
	 * Creates a new thread.
	 */
	create: function(params) {

		var valids, body = {
			access_token: config.disqus.access_token,
			api_secret : config.disqus.api_secret,
			forum: config.disqus.forum_id
		};


		if(params.link) {
			body.url = params.link;
		} else if(params.ident) {
			body.identifier = params.ident;
		} else {
			return errors.disqusRequestError('请传入创建Thread相应的参数。');
		}


		if(params.title) {
			body.title = params.title;
		} else {
			return errors.disqusRequestError('请传入创建Thread相应的参数。');
		}


		valids = [{
			value: body.access_token,
			name: 'access_token',
			valids: ['required']
		}, {
			value: body.api_secret,
			name: 'api_secret',
			valids: ['required']
		}, {
			value: body.forum,
			name: 'Looks up a forum by ID (aka short name)',
			valids: ['required']
		}, {
			value: body.title,
			name: '博客标题',
			valids: ['required']
		}];


		return utils.validate(valids)()
		.then(function() {
			return rp({
			    method: 'POST',
			    uri: utils.getDisqusURL('threads/create'),
			    form: body,
			    json: true // Automatically stringifies the body to JSON
			});
		}).catch(function(err) {
			return errors.disqusRequestError(err);
		});
	},


	/**
	 * Returns thread details.
	 */
	details: function(params) {
		var valids, qs = {
			api_key: config.disqus.api_key,
			forum: config.disqus.forum_id
		};


		if(params.link) {
			qs['thread:link'] = params.link;
		} else if(params.ident) {
			qs['thread:ident'] = params.ident;
		} else {
			return errors.disqusRequestError('请传入查询参数！[请查看网页中disqus_config变量是否配置成功]');
		}


		valids = [{
			value: qs.api_key,
			name: 'api_key',
			valids: ['required']
		}, {
			value: qs.forum,
			name: 'Looks up a forum by ID (aka short name)',
			valids: ['required']
		}];


		return utils.validate(valids)()
		.then(function() {
			return rp({
				uri: utils.getDisqusURL('threads/details'),
				qs: qs,
				json: true	
			});
		});
	},


	/**
	 * Returns a list of posts within a thread.
	 */
	listPosts: function(params) {
		var valids, qs = {
			limit: 50,
		    order: 'asc', //desc
			access_token: config.disqus.access_token,
			api_secret : config.disqus.api_secret,
			forum: config.disqus.forum_id
		};


		if(params.thread) {
			qs.thread = params.thread;
		} else if(params.link) {
			qs['thread:link'] = params.link;
		} else if(params.ident) {
			qs['thread:ident'] = params.ident;
		} else {
			return errors.disqusRequestError('请传入查询参数！[请查看网页中disqus_config变量是否配置成功]');
		}


		if(params.cursor) {
			qs.cursor = params.cursor;
		}


		valids = [{
			value: qs.access_token,
			name: 'access_token',
			valids: ['required']
		}, {
			value: qs.api_secret,
			name: 'api_secret',
			valids: ['required']
		}, {
			value: qs.forum,
			name: 'Looks up a forum by ID (aka short name)',
			valids: ['required']
		}];


		return utils.validate(valids)()
		.then(function() {
			return rp({
				uri: utils.getDisqusURL('threads/listPosts'),
				qs: qs,
				json: true	
			});
		}).catch(function(err) {
			return errors.disqusRequestError(err);
		});
	}
};