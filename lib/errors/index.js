var path = require('path'),
	_ = require('lodash'),
	chalk = require('chalk'),
	Promise = require('bluebird'),
	config = require('../config'),
	escapeExpression = require('../utils/escape.js'),
	ValidationError = require('./validation-error'),
	InternalServerError = require('./internal-server-error'),
	NoPermissionError = require('./no-permission-error'),
	errors;

errors = {
	throwError: function (err) {
	    if (!err) {
	        err = new Error('一个致命错误');
	    }

	    if (_.isString(err)) {
	        throw new Error(err);
	    }

	    throw err;
	},

	rejectError: function (err) {
	    return Promise.reject(err);
	},

	logInfo: function (component, info) {
	    if ((process.env.NODE_ENV === 'development' ||
	        process.env.NODE_ENV === 'staging' ||
	        process.env.NODE_ENV === 'production')) {
	        console.info(chalk.cyan(component + ':', info));
	    }
	},

	logWarn: function (warn, context, help) {
	    if ((process.env.NODE_ENV === 'development' ||
	        process.env.NODE_ENV === 'staging' ||
	        process.env.NODE_ENV === 'production')) {
	        warn = warn || '未知';
	        var msgs = [chalk.yellow('\nWarning:', warn), '\n'];

	        if (context) {
	            msgs.push(chalk.white(context), '\n');
	        }

	        if (help) {
	            msgs.push(chalk.green(help));
	        }

	        // add a new line
	        msgs.push('\n');

	        console.log.apply(console, msgs);
	    }
	},

	logError: function (err, context, help) {
	    var self = this,
	        origArgs = _.toArray(arguments).slice(1),
	        stack,
	        msgs;

	    if (_.isArray(err)) {
	        _.each(err, function (e) {
	            var newArgs = [e].concat(origArgs);
	            errors.logError.apply(self, newArgs);
	        });
	        return;
	    }

	    stack = err ? err.stack : null;

	    if (!_.isString(err)) {
	        if (_.isObject(err) && _.isString(err.message)) {
	            err = err.message;
	        } else {
	            err = '一个未知的致命错误.';
	        }
	    }

	    // Overwrite error to provide information that this is probably a permission problem
	    // TODO: https://github.com/TryGhost/Ghost/issues/3687
	    if (err.indexOf('SQLITE_READONLY') !== -1) {
	        context = 'Your database is in read only mode. Visitors can read your blog, but you can\'t log in or add posts.';
	        help = 'Check your database file and make sure that file owner and permissions are correct.';
	    }
	    // TODO: Logging framework hookup
	    // Eventually we'll have better logging which will know about envs
	    if ((process.env.NODE_ENV === 'development' ||
	        process.env.NODE_ENV === 'staging' ||
	        process.env.NODE_ENV === 'production')) {
	        msgs = [chalk.red('\nERROR:', err), '\n'];

	        if (context) {
	            msgs.push(chalk.white(context), '\n');
	        }

	        if (help) {
	            msgs.push(chalk.green(help));
	        }

	        // add a new line
	        msgs.push('\n');

	        if (stack) {
	            msgs.push(stack, '\n');
	        }

	        console.error.apply(console, msgs);
	    }
	},

	logErrorAndExit: function (err, context, help) {
	    this.logError(err, context, help);
	    // Exit with 0 to prevent npm errors as we have our own
	    process.exit(0);
	},

	logAndThrowError: function (err, context, help) {
	    this.logError(err, context, help);

	    this.throwError(err, context, help);
	},

	logAndRejectError: function (err, context, help) {
	    this.logError(err, context, help);

	    return this.rejectError(err, context, help);
	},

	logErrorWithRedirect: function (msg, context, help, redirectTo, req, res) {
	    /*jshint unused:false*/
	    var self = this;

	    return function () {
	        self.logError(msg, context, help);

	        if (_.isFunction(res.redirect)) {
	            res.redirect(redirectTo);
	        }
	    };
	},

    formatHttpErrors: function formatHttpErrors(error) {
        var statusCode = 500,
            errors = [];

        if (!_.isArray(error)) {
            error = [].concat(error);
        }

        _.each(error, function each(errorItem) {
            var errorContent = {};

            // TODO: add logic to set the correct status code
            statusCode = errorItem.code || 500;

            errorContent.message = _.isString(errorItem) ? errorItem :
                (_.isObject(errorItem) ? errorItem.message : 'Unknown API Error');
            errorContent.type = errorItem.errorType || 'InternalServerError';
            errors.push(errorContent);
        });

        return {errors: errors, statusCode: statusCode};
    },

    formatAndRejectAPIError: function (error, permsMessage) {
        if (!error) {
            return this.rejectError(
                new this.NoPermissionError(permsMessage || '应用的接口访问权限受限')
            );
        }

        if (_.isString(error)) {
            return this.rejectError(new this.NoPermissionError(error));
        }

        if (error.errorType) {
            return this.rejectError(error);
        }

        // handle database errors
        if (error.code && (error.errno || error.detail)) {
            error.db_error_code = error.code;
            error.type = 'DatabaseError';
            error.code = 500;

            return this.rejectError(error);
        }

        return this.rejectError(new this.InternalServerError(error));
    },

	handleAPIError: function errorHandler(err, req, res, next) {
        /*jshint unused:false */
        var httpErrors = this.formatHttpErrors(err);
        this.logError(err);
        // Send a properly formatted HTTP response containing the errors
        res.status(httpErrors.statusCode).json({success: false, errors: httpErrors.errors});
    },

    renderErrorPage: function (err, req, res, next) {
        /*jshint unused:false*/
        var self = this,
        	code = 500,
        	defaultErrorTemplatePath = path.resolve(config.paths.views, 'error.ejs');

        function parseStack(stack) {
            if (!_.isString(stack)) {
                return stack;
            }

            // TODO: split out line numbers
            var stackRegex = /\s*at\s*(\w+)?\s*\(([^\)]+)\)\s*/i;

            return (
                stack
                    .split(/[\r\n]+/)
                    .slice(1)
                    .map(function (line) {
                        var parts = line.match(stackRegex);
                        if (!parts) {
                            return null;
                        }

                        return {
                            function: parts[1],
                            at: parts[2]
                        };
                    })
                    .filter(function (line) {
                        return !!line;
                    })
            );
        }

        function renderErrorInt(errorView) {
            var stack = null;

            if (code !== 404 && process.env.NODE_ENV !== 'production' && err.stack) {
                stack = parseStack(err.stack);
            }

            res.status(code).render((errorView || 'error.ejs'), {
                message: err.message || err,
                code: code,
                stack: stack
            }, function (templateErr, html) {
                if (!templateErr) {
                    return res.status(code).send(html);
                }
                // There was an error trying to render the error page, output the error
                self.logError(templateErr, 'Error whilst rendering error page', 'Error template has an error');

                // And then try to explain things to the user...
                // Cheat and output the error using handlebars escapeExpression
                return res.status(500).send(
                    '<h1>Oops. 发现传说中的模板错误...</h1>' +
                    '<p>Encountered the error: </p>' +
                    '<pre>' + escapeExpression(templateErr.message || templateErr) + '</pre>' +
                    '<br ><p>whilst trying to render an error page for the error: </p>' +
                    code + ' ' + '<pre>'  + escapeExpression(err.message || err) + '</pre>'
                );
            });
        }

        return renderErrorInt(defaultErrorTemplatePath);
    }
};


_.each([
    'logWarn',
    'logInfo',
    'rejectError',
    'throwError',
    'logError',
    'logAndThrowError',
    'logAndRejectError',
    'logErrorAndExit',
    'logErrorWithRedirect',
    'handleAPIError',
    'formatHttpErrors',
    'renderErrorPage'

], function (funcName) {
    errors[funcName] = errors[funcName].bind(errors);
});

module.exports = errors;
module.exports.ValidationError = ValidationError;
module.exports.NoPermissionError = NoPermissionError;
module.exports.InternalServerError = InternalServerError;