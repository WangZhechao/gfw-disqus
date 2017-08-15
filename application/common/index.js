var Promise = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto'),
	rp = require('request-promise'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	utils = require('../../lib/utils');


function formatPost(post) {

	var email, obj, defAvatar;

  	obj = _.pick(post, ['dislikes', 'likes', 'message', 'createdAt', 
  		'id', 'media', 'parent', 'author.isAnonymous', 
  		'author.name', 'author.url', 'author.avatar']);
	
	email = _.get(post, 'author.email', null);

	defAvatar = config.server.url + '/images/noavatar92.png';


	if(!obj.isAnonymous && email === config.disqus.admin_email && 
		obj.author.name === config.disqus.admin_name) {
		obj.author.isAdmin = true;
	} else {
		obj.author.isAdmin = false;
	}


	//头像
	if(obj.isAnonymous) {
		if(email)
			obj.author.avatar = config.gravatar_cdn + '/' + utils.md5(email) + '?d=' + defAvatar;
		else
			obj.author.avatar = defAvatar;
	} else {
		obj.author.avatar = post.author.avatar.cache;
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