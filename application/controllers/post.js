var Promise = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils');



var formatPost = function(post, author) {

	var obj = _.assign(post, author);

	var defAvatar = config.server.url + '/images/noavatar92.png';

	//头像
	if(obj.isAnonymous) {
		if(obj.email)
			obj.avatar = config.gravatar_cdn + '/' + utils.md5(obj.email) + '?d=' + defAvatar;
		else
			obj.avatar = defAvatar;
	} else {
		obj.avatar = obj.avatar.cache;
	}


	if(!obj.message)
		obj.message = '';

	//表情


	//去除连接重定向
	// var urlPat = '/<a.*?href="(.*?disq\.us.*?)".*?>(.*?)<\/a>/ig';
	// obj.message = obj.message.replace(urlPat, function(a) {

	// });


	//去掉图片
	var imgpat = /<a(.*?)href="(.*?\.(jpg|gif|png))"(.*?)>(.*?)<\/a>/ig;
    obj.message = obj.message.replace(imgpat, '');

    var imgs = [];
    for(var i=0,len=obj.media.length; i<len; i++) {
    	imgs.push(obj.media[i].url);
    }
    obj.media = imgs;

	return obj;
}


module.exports = {

	list: function(params) {

		var qs = {
		    api_key: config.disqus.api_key,
		    forum: config.disqus.forum_id
		};


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


		return rp({
			uri: utils.getDisqusURL('threads_details'),
			qs: _.assign(qs, tqs),

			json: true			
		}).then(function (res) {
			console.log(res);
			return Promise.resolve(_.pick(res.response, ['likes', 'isClosed', 'slug', 'id']));
	    }).then(function(thread) {
	    	return rp({
	    		uri: utils.getDisqusURL('threads_listPosts'),
	    		qs: _.assign(qs, page, {thread: thread.id}),

	    		json: true
	    	}).then(function(res) {
	    		thread.postTotal = thread.posts;
	    		thread.posts = [];
	    		_.forEach(res.response, function(obj) {
	    		  	var post = _.pick(obj, ['dislikes', 'likes', 'message', 'createdAt', 'id', 'media', 'parent']);
	    			var author = _.pick(obj.author, ['isAnonymous', 'name', 'url', 'email', 'avatar']);
// if(author.email) {
// 	console.log('===========================');
// 	console.log(res.response);
// 	console.log('===========================');	
// }

	    			thread.posts.push(formatPost(post, author));
	    		});

	    		thread.cursor = res.cursor || {more: false};

				return Promise.resolve({success: true, thread: thread});
	    	});
	    }).catch(function (err) {
	    	return errors.disqusRequestError(err);
	    });
	}	

};