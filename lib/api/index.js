var _ = require('lodash'),
	log = require('../utils/logger.js'),
	errors = require('../errors');

function json(apiMethod) {

	return function(req, res, next) {
		var object = req.body,
		    options = _.assignIn({}, req.files, req.query, req.params, {
		    	path: req.path,
		    	method: req.method,
		    	ip: req.ip
		    });

		//GET,DELETE  ->  req.body is null.
		//PUT,POST,PATCH  ->  req.body is an object
		if(_.isEmpty(object)) {
			object = options;
			options = {};
		}

		if(!_.isFunction(apiMethod)) {
			return errors.logErrorAndExit(new Error('路由处理函数格式错误！'), '',
			 '路由函数绑定支持{view: function}/{json: function}/function/...');
		}


		log.write('JSON', object, options).then(function() {
			return apiMethod(object, options);
		}).then(function(response) {
			res.json(response || {});
		}).catch(function onAPIError(error) {
            return res.json(errors.formatHttpErrors(error));
        });
	};
}

function html(apiMethod) {

	return function(req, res, next) {
		var object = req.body,
		    options = _.assignIn({}, req.files, req.query, req.params, {
		    	path: req.path,
		    	method: req.method,
		    	ip: req.ip
		    });

	    if(!_.isFunction(apiMethod)) {
	    	return errors.logErrorAndExit(new Error('路由处理函数格式错误！'), '',
	    	 '路由函数绑定支持{view: function}/{json: function}/function/...');
	    }


	    log.write('HTML', options, object).then(function() {
	    	return apiMethod(options);
	    }).then(function(templateData) {
			var view = templateData.view || '404.ejs',
				locals = templateData.locals || {};

			res.render(view, locals);
		}).catch(function onAPIError(error) {
            next(error);
        });
	};
}

module.exports = {
	json: json,
	html: html
};