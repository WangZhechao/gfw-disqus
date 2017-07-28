var Promise = require('bluebird'),
	chalk = require('chalk'),
	path = require('path'),
	http = require('http'),
	config = require('../config'),
	errors = require('../errors');


function SHPServer(rootApp) {
	this.rootApp = rootApp;
	this.httpServer = null;
	this.tcpNet = null;
	this.connections = {};
	this.connectionId = 0;
}


SHPServer.prototype.start = function(externalApp) {
	var self = this,
	 	rootApp = externalApp ? externalApp : self.rootApp;

	return new Promise(function(resolve) {
		self.httpServer = rootApp.listen(
			config.server.port,
			config.server.host
		);


		self.httpServer.on('error', function(error) {
			if(error.errno === 'EADDRINUSE') {
				errors.logError('(EADDRINUSE) 程序启动失败！',
					'端口：' + config.server.port + '被另一个程序占用。',
					'您是否已经开启了该服务？请检查端口使用情况。');
			} else {
				errors.logError('(Code: ' + error.errno + ')',
					'程序启动失败！',
					'请百度该错误代码寻找解决方案。');
			}

			process.exit(-1);
		});
		

		self.httpServer.on('connection', self.connection.bind(self));
		self.httpServer.on('listening', function() {
			self.logStartMessages();
			resolve(self);
		});
	});
};


SHPServer.prototype.stop = function() {
	var self = this;

	return new Promise(function(resolve) {
		if(self.httpServer === null) {
			resolve(self);
		} else {
			self.httpServer.close(function() {
				self.httpServer = null;
				self.logShutdownMessages();
				resolve(self);
			});

			self.closeConections();
		}
	});
};


SHPServer.prototype.restart = function() {
	return this.stop().then(this.start.bind(this));
};


SHPServer.prototype.connection = function(socket) {
	var self = this;

	self.connectionId += 1;
	socket._tsId = self.connectionId;

	socket.on('close', function() {
		delete self.connections[this._tsId];
	});

	self.connections[socket._tsId] = socket;
};


SHPServer.prototype.closeConections = function() {
	var self = this;

	Object.keys(self.connections).forEach(function(socketId) {
		var socket = self.connections[socketId];

		if(socket) {
			socket.destroy();
		}
	});
};


SHPServer.prototype.logStartMessages = function() {

	if(process.env.NODE_ENV === 'production') {
		console.log(chalk.green('\n服务已开启...'), chalk.gray('Ctrl + C 终止！'));
	} else {
		console.log(chalk.green('\n服务已开启...' + config.server.host + ':' + config.server.port), chalk.gray(' Ctrl + C 终止！' ));
	}

	function shutdown() {
		console.log(chalk.red('\n服务已经关闭！'));

		if(process.env.NODE_ENV !== 'production') {
			console.log(chalk.yellow('\n本服务运行：' + Math.round(process.uptime()) + 's'));
		}

		process.exit(0);
	}

	process
		.removeAllListeners('SIGINT').on('SIGINT', shutdown)
		.removeAllListeners('SIGTERM').on('SIGTERM', shutdown);
};


SHPServer.prototype.logShutdownMessages = function() {
	console.log(chalk.red('\n服务后台关闭...'));
};


module.exports = SHPServer;


