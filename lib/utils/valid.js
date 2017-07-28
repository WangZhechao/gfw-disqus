/**
 * 取自thinkjs
 */

var Promise = require('bluebird'),
    _       = require('lodash'),
    path    = require('path'),
    net 	= require('net'),
    errors  = require('../errors');

var Valid = {

	/**
	 * 必填
	 * @return {[type]} [description]
	 */
	required: function(value) {
		'use strict';
		return ((value || '') + '').length > 0;
	},

	/**
	 * 邮箱
	 * @return {[type]} [description]
	 */
	email: function(value) {
		'use strict';
		var reg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
		return this.regexp(value, reg);
	},
	/**
	 * 时间戳
	 * @return {[type]} [description]
	 */
	time: function(value) {
		'use strict';
		var reg = /^[1-5]\d{12}$/;
		return this.regexp(value, reg);
	},
	/**
	 * 中文名
	 * @return {[type]} [description]
	 */
	cnname: function(value) {
		'use strict';
		var reg = /^[\u4e00-\u9fa5\u3002\u2022]{2,32}$/;
		return this.regexp(value, reg);
	},
	/**
	 * 身份证号码
	 * @return {[type]} [description]
	 */
	idnumber: function(value) {
		'use strict';
		if (/^\d{15}$/.test(value)) {
			return true;
		}
		if ((/^\d{17}[0-9xX]$/).test(value)) {
			var vs = '1,0,x,9,8,7,6,5,4,3,2'.split(','),
				ps = '7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2'.split(','),
				ss = value.toLowerCase().split(''),
				r = 0;
			for (var i = 0; i < 17; i++) {
				r += ps[i] * ss[i];
			}
			var isOk = (vs[r % 11] === ss[17]);
			return isOk;
		}
		return false;
	},
	/**
	 * 手机号
	 * @return {[type]} [description]
	 */
	mobile: function(value) {
		'use strict';
		var reg = /^(13|15|18|14|17)\d{9}$/;
		return this.regexp(value, reg);
	},
	/**
	 * 邮编
	 * @return {[type]} [description]
	 */
	zipcode: function(value) {
		'use strict';
		var reg = /^\d{6}$/;
		return this.regexp(value, reg);
	},

	/**
	 * url
	 * @return {[type]} [description]
	 */
	url: function(value) {
		'use strict';
		var reg = /^http(s?):\/\/(?:[A-za-z0-9-]+\.)+[A-za-z]{2,4}(?:[\/\?#][\/=\?%\-&~`@[\]\':+!\.#\w]*)?$/;
		return this.regexp(value, reg);
	},
	/**
	 * 整数
	 * @param  {[type]} o [description]
	 * @return {[type]}   [description]
	 */
	int: function(value) {
		'use strict';
		var val = parseInt(value, 10);
		if (isNaN(val)) {
			return false;
		}
		return (val + '').length === (value + '').length;
	},
	/**
	 * 浮点数
	 * @return {[type]} [description]
	 */
	float: function(value) {
		'use strict';
		return isNumberString(value);
	},


	/**
	 * ip4校验
	 * @return {[type]} [description]
	 */
	ip4: function(value) {
		'use strict';
		return net.isIPv4(value);
	},
	/**
	 * ip6校验
	 * @return {[type]} [description]
	 */
	ip6: function(value) {
		'use strict';
		return net.isIPv6(value);
	},
	/**
	 * ip校验
	 * @return {[type]} [description]
	 */
	ip: function(value) {
		'use strict';
		return net.isIP(value);
	},
	/**
	 * 日期校验
	 * @return {[type]} [description]
	 */
	date: function(value) {
		'use strict';
		var reg = /^\d{4}-\d{1,2}-\d{1,2}$/;
		return this.regexp(value, reg);
	},


	/**
	 * 长度限定
	 * @param  {String} value 字符串
	 * @param  {Int} min   最小长度
	 * @param  {Int} max   最大长度
	 * @return {Boolean}
	 */
	length: function(value, min, max) {
		'use strict';
		min = min | 0;
		var length = ((value || '') + '').length;
		if (length < min) {
			return false;
		}
		if (max && length > max) {
			return false;
		}
		return true;
	},


	/**
	 * 自定义正则校验
	 * @param  {[type]} reg [description]
	 * @return {[type]}     [description]
	 */
	regexp: function(value, reg) {
		'use strict';
		return reg.test(value);
	},

	/**
	 * 2次值是否一致
	 * @param  {[type]} field [description]
	 * @return {[type]}       [description]
	 */
	confirm: function(value, cvalue) {
		'use strict';
		return value === cvalue;
	},

	/**
	 * 整数范围
	 * @param  {[type]} min [description]
	 * @param  {[type]} max [description]
	 * @return {[type]}     [description]
	 */
	range: function(value, min, max) {
		'use strict';
		value = parseInt(value, 10);
		min = min | 0;
		if (isNaN(value) || value < min) {
			return false;
		}
		if (max && value > max) {
			return false;
		}
		return true;
	},

	/**
	 * 在一个范围内
	 * @param  {[type]} value [description]
	 * @param  {[type]} arr   [description]
	 * @return {[type]}       [description]
	 */
	in : function(value, arr) {
		'use strict';
		return arr.indexOf(value) > -1;
	}
};

/**
 * data格式
 * [{
 *     value: xxx,
 *     name: '',
 *     valids: ['required', 'range'],
 *     range_args: []
 * },{
 *     value: xxx,
 *     name: '',
 *     valids: ['required', 'range'],
 *     range_args: []
 * }]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */

//带参函数
var arg_funs = {
	length: true,
	regexp: true,
	confirm: true,
	range: true,
	in: true
};


module.exports = function(data) {

	function validate(opts) {
		var res, cv, args, validationErrors = [];

		_.forEach(data, function(field) {

			if(!(field.valids && _.isArray(field.valids) && field.valids.length > 0)) {
				return true;
			}

			_.forEach(field.valids, function(validItem) {

				res = false;

				//调用参数
				args = [field.value];
				if(arg_funs[validItem]) {

					cv = field[validItem + '_args'] || [];
					if(!_.isArray(cv)) {
						cv = [cv];
					}

					args = args.concat(cv);
				}

				//调用
				if(_.isFunction(Valid[validItem])) {
					res = Valid[validItem].apply(Valid, args);

					if(res === false) {
						validationErrors.push(new errors.ValidationError('校验 (' + field.name + ') 失败，该值不符合要求： ' + field.value, field.value));
					}
				} else {
					validationErrors.push(new errors.ValidationError('校验 (' + field.name + ') 失败，没有该校验函数：', arg_funs[validItem]));
				}
			});
		});

		if (_.isEmpty(validationErrors)) {
		    return Promise.resolve(opts);
		}

		return errors.logAndRejectError(validationErrors[0]);
	}

	return validate;
};
