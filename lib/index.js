var express = require('express'),
	run = require('./core'),
	errors = require('./errors'),
	parentApp = express();


process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//启动服务
run().then(function(disqusServer) {
	parentApp.use('/', disqusServer.rootApp);
	return disqusServer.start(parentApp);
}).catch(function(err) {
	errors.logErrorAndExit(err, err.context, err.help);
});