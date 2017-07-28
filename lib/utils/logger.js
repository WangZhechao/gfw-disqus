var _ = require('lodash'),
	moment = require('moment'),
	os = require('os'),
	winston = require('winston'),
	config = {
		levels: {
			error: 0,
			warn: 1,
			info: 2,
			see: 3
		},

		colors: {
			info: 'green',
			warn: 'yellow',
			error: 'red',
			see: 'blue'
		}
	};

var logger = new(winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			colorize: true,
			level: 'info'
	    }),
		new (winston.transports.File)({
			name: 'logger',
			filename: 'logger.log',
			maxsize: 1024*1024*10,
			maxFiles: 3
		})
	],

	levels: config.levels,
	colors: config.colors
});


// function watchMemory() {
// 	var format = function(data){
// 		return (data / 1048576).toFixed(1) + 'MB'; // 1048576 = 1024 * 1024
// 	};

// 	setInterval(function(){
// 		var memoryUsage = process.memoryUsage(),
// 			loadAvg = os.loadavg(),
// 			msgs = [
// 			'rss:' + format(memoryUsage.rss),
// 			'heapTotal:' + format(memoryUsage.heapTotal),
// 			'heapUsed:' + format(memoryUsage.heapUsed),
// 			'freeMemory:' + format(os.freemem()),
// 			'loadAvg:' + loadAvg[0].toFixed(1) + ',' + loadAvg[1].toFixed(1) + ',' + loadAvg[2].toFixed(2)
// 		];
	  
// 	  	if(config.logging) {
// 	  		logger.info(msgs);
// 	  	}
	  	
// 	}, 60 * 1000 * 60);
// }



module.exports = {

	write: function(type, opts, obj) {
		var optsJson, obJson, log,
			use = ['type', 'ak', 'method', 'path', 'ip'];

		try {
			optsJson = JSON.stringify(_.omit(opts, use));
			obJson = JSON.stringify(obj);
		} catch(e) {
			optsJson = '';
			obJson = '';
		}

	 	log = _.merge({
				insertTime: moment().format('YYYY-MM-DD HH:mm:ss'),
				optsJson: optsJson,
				obJson: obJson
			}, _.pick(opts, use));


	 	if(config.logging) {
	 		logger.info(log);
	 	}

		return Promise.resolve(log);
	}
};