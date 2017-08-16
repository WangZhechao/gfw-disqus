var Promise = require('bluebird'),
	_ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	express = require('express'),
	api = require('../api'),
	config = require('../config'),
	errors = require('../errors');


function safeRequire(file){
  'use strict';
  try{
    return require(file);
  }catch(err){
  	errors.logErrorAndExit(err, err.context, '请检测文件：' + file);
  }
}


//加载基础模块
function loadBaseModule() {
	// var paths = ['./db.js'];
	// var aliases = ['DB'];

	// for(var i=0,ln=paths.length; i<ln; i++) {
	// 	if(paths[i] && aliases[i]) {
	// 		global[aliases[i]] = safeRequire(paths[i]);
	// 	}
	// }

	global.M = {}; //模型
	global.C = {}; //控制器
	global.D = {}; //Disqus API
}


//加载模型
function loadModels() {
	var dirPath = config.paths.models;

	var files = fs.readdirSync(dirPath);
	if(!files) {
		var err = new Error('加载模型文件错误！');
		return errors.logErrorAndExit(err, err.context, 'models文件夹是否存在！');
	}

	files.forEach(function(fileName) {
		if(path.extname(fileName) !== '.js') {
			return true;
		}

		var filePath = path.join(dirPath, '/' + fileName);
		var fileStat = fs.statSync(filePath);

		if(fileStat.isFile()) {
			global.M[path.basename(fileName, '.js')] = safeRequire(filePath);
		}
	});
}


//加载控制器
function loadControllers() {
	var dirPath = config.paths.controllers;

	var files = fs.readdirSync(dirPath);
	if(!files) {
		var err = new Error('加载控制器文件错误！');
		return errors.logErrorAndExit(err, err.context, 'controllers文件夹是否存在！');
	}

	files.forEach(function(fileName) {
		if(path.extname(fileName) !== '.js') {
			return true;
		}
		
		var filePath = path.join(dirPath, '/' + fileName);
		var fileStat = fs.statSync(filePath);

		if(fileStat.isFile()) {
			global.C[path.basename(fileName, '.js')] = safeRequire(filePath);
		}
	});
}


//加载disqus api
function loadDisqusAPIs() {
	var dirPath = config.paths.disqus;

	var files = fs.readdirSync(dirPath);
	if(!files) {
		var err = new Error('加载Disqus API文件错误！');
		return errors.logErrorAndExit(err, err.context, 'disqus文件夹是否存在！');
	}

	files.forEach(function(fileName) {
		if(path.extname(fileName) !== '.js') {
			return true;
		}
		
		var filePath = path.join(dirPath, '/' + fileName);
		var fileStat = fs.statSync(filePath);

		if(fileStat.isFile()) {
			global.D[path.basename(fileName, '.js')] = safeRequire(filePath);
		}
	});
}


//加载路由器
function loadRoutes() {
	var dirPath = config.paths.routes;
	var routeConfig = safeRequire(dirPath);
	var actions = _.keys(routeConfig);

	//解析
	var analyze = function(rootApp) {
		var apiRouter = express.Router();
		var viewRouter = express.Router();

		var method, uri, controller, last, flag, isNormal, apiArray = [], viewArray = [];


		//生成路由关系表
		_.forEach(actions, function(action) {
			var arr = action.split(' ');
			if(arr.length > 1) {
				method = arr[0];
				uri = arr[1];
			} else {
				uri = arr[0];
				method = 'use';
			}

			if(!apiRouter[method]) {
				errors.logWarn('路由表的HTTP请求方法不支持！[' + method + ']');
				return true;
			}

			//如果是对象
			controller = routeConfig[action];
			isNormal = controller ? true : false;

			if(_.isArray(controller) && controller.length > 0) {
				flag = true;
				last = controller.pop();

				if(_.isObject(last) && last.view) {
					last = api.html(last.view);
					flag = false;
				} else if(_.isObject(last) && last.json) {
					last = api.json(last.json);
				} else if(_.isObject(last) && last.redirect){
					 last = api.redirect(last.redirect);
				} else if(_.isFunction(last)) {
					last = api.json(last);
				} else {
					isNormal = false;
				}

				controller.push(last);
				isNormal = last ? true : false;
				if(flag) {
					viewArray.push({method: method, params: [uri, controller]});
				} else {
					apiArray.push({method: method, params: [uri, controller]});
				}
			} else if(_.isFunction(controller)) {
				apiArray.push({method: method, params: [uri, api.json(controller)]});
			} else if(_.isObject(controller)) {
				if(controller.view) {
					isNormal = controller.view ? true : false;
					viewArray.push({method: method, params: [uri, api.html(controller.view)]});
				} else if(controller.json) {
					isNormal = controller.json ? true : false;
					apiArray.push({method: method, params: [uri, api.json(controller.json)]});
				} else if(controller.redirect) {
					isNormal = controller.redirect ? true : false;
					apiArray.push({method: method, params: [uri, api.redirect(controller.redirect)]});
				} else {
					isNormal = false;
				}
			} else {
				isNormal = false;
			}

			if(!isNormal) {
				errors.logWarn('路由表中的路由[' + action + ']对应的处理函数异常！');
			}
		});

		//加载view路由
		viewArray.forEach(function(view) {
			viewRouter[view.method].apply(viewRouter, view.params);
		});
		viewRouter.use(errors.renderErrorPage);

		//加载API路由
		apiArray.forEach(function(api) {
			apiRouter[api.method].apply(apiRouter, api.params);
		});
		apiRouter.use(errors.handleAPIError);

		
		rootApp.use(config.viewUri, viewRouter);
		rootApp.use(config.apiUri, apiRouter);
	};

	return analyze;
}


//初始化
function init(config) {

	//加载基础模块
	loadBaseModule();

	//加载模型
	loadModels();

	//加载Disqus相关API请求
	loadDisqusAPIs();

	//加载控制器
	loadControllers();

	//加载路由
	return Promise.resolve(loadRoutes());
}

module.exports.init = init;
