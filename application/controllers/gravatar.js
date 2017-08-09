var dns = require('dns'),
	Promise = require('bluebird'),
	utils = require('../../lib/utils'),
	errors = require('../../lib/errors'),
	config = require('../../lib/config'),
	resolveMx = Promise.promisify(dns.resolveMx);


module.exports = {

	get: function(params) {

		var email = params.email;

		var valids = [{
			value: email,
			name: 'email',
			valids: ['required', 'email']
		}];


		return utils.validate(valids)().then(function() {
			var hostname = email.split('@').pop();
			if(!hostname) {
				return errors.logAndRejectError('请输出正确email地址');
			}

			return resolveMx(hostname);

		}).then(function(address) {

			var defAvatar = config.server.url + '/images/noavatar92.png';
			var avatar = config.gravatar_cdn + '/' + utils.md5(email) + '?d=' + defAvatar;

			return Promise.resolve({success: true, data: {gravatar: avatar}});

		}).catch(function(err) {
			return errors.disqusRequestError(err);
		});

	}
};