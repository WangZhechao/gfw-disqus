var Promise = require('bluebird');



module.exports = {

	browse: function() {


		// var test = [{
		//     value: 4,
		//     name: '测试A',
		//     valids: ['int']
		// },{
		//     value: 2,
		//     name: '测试B',
		//     valids: ['required', 'range'],
		//     range_args: [0, 3]
		// }];

		// return utils.validate(test);

		return M.home.browse();

		// return Promise.resolve({
		// 	view: 'home.ejs',
		// 	locals: {title: 'SHP测试主页！'}
		// });
	}	

};