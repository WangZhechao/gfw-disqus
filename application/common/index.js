var Promise = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils');


function formatPost(post) {

	var info, author, email, obj, defAvatar;

  	info = _.pick(post, ['dislikes', 'likes', 'message', 'createdAt', 'id', 'media', 'parent']);
	author = _.pick(post.author, ['isAnonymous', 'name', 'url', 'avatar']);
	obj = _.assign(post, author);
	email = _.get(post, 'author.email', null);
	defAvatar = config.server.url + '/images/noavatar92.png';

	//头像
	if(obj.isAnonymous) {
		if(email)
			obj.avatar = config.gravatar_cdn + '/' + utils.md5(email) + '?d=' + defAvatar;
		else
			obj.avatar = defAvatar;
	} else {
		obj.avatar = obj.avatar.cache;
	}


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
	formatPost: formatPost
};