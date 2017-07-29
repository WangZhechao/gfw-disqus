var apiRoutes = {
	'get /': {view: C.home.browse},

	'get /listPosts': {json: C.comment.list}
};

module.exports = apiRoutes;