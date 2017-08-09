var Promise = require('bluebird'),
	express = require('express'),
	logger = require('morgan'),
	compress = require('compression'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	favicon = require('serve-favicon'),
	path = require('path'),
	config = require('../config'),
	utils = require('../utils'),
	system = require('./system.js'),
	cors = require('cors'),
	SHPServer = require('./server.js'),
	errors = require('../errors'),
	_ = require('lodash');


function init(options) {

	var adminApp = express();
	options = options || {};

	return config.load(options.config).then(function(config) {

			//初始化系统核心
			return system.init(config);

	}).then(function(setRouter) {

		//是否开启压缩
		if(config.server.compress !== false) {
		    adminApp.use(compress());
		}

		//设置模板引擎
		adminApp.set('views', config.paths.views);
		adminApp.set('view engine', 'ejs');


		//是否开启代理
		if(config.server.proxy === true) {
			adminApp.enable('trust proxy');
		} else {
			adminApp.disable('trust proxy');
		}

		//日志信息
		//https://github.com/expressjs/morgan
		var logging = config.logging;
		if (logging !== false) {
		    if (adminApp.get('env') !== 'development') {
		        adminApp.use(logger('combined', logging));
		    } else {
		        adminApp.use(logger('dev', logging));
		    }
		}

		adminApp.use(favicon(path.join(config.paths.assets, '/favicon.ico')));
		adminApp.use(bodyParser.json({limit: '1mb'}));
		adminApp.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));
		adminApp.use(cookieParser());
		adminApp.use(session({
			secret: config.cookie.secret,
			key: config.cookie.key,
			store: null,
			resave: true,
			saveUninitialized: true
		}));

		//设置静态文件路径
		adminApp.use(express.static(config.paths.assets, {maxAge: utils.ONE_YEAR_MS}));


		//跨域
		var whitelist = config.disqus.auth_website;
		if(_.isString(whitelist) && whitelist !== '*') {
			whitelist = [ whitelist ];
		}

		var corsOptions = {
		  origin: function (origin, callback) {
		  	if(origin === undefined || whitelist === '*' || whitelist.indexOf(origin) !== -1) {
		      callback(null, true);
		    } else {
		    	console.log(origin);
		      callback(new Error('Not allowed by CORS'));
		    }
		  }
		}

		adminApp.use(cors(corsOptions));

		//设置路由
		setRouter(adminApp);

		return new SHPServer(adminApp);
	});
}


module.exports = init;