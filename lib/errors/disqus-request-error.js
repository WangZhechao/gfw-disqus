function DisqusRequestError(code, message) {
    this.message = message || 'Disqus API Request Error';
    this.stack = new Error().stack;
    this.code = code || 500;
    this.errorType = this.name;
}

DisqusRequestError.prototype = Object.create(Error.prototype);
DisqusRequestError.prototype.name = 'DisqusRequestError';

module.exports = DisqusRequestError;
