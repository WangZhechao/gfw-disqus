var apiRoutes = {
	'get /': {view: C.home.browse},
	'get /comments': {view: C.comment.browse},

	'get /listPosts': {json: C.post.list}
};

module.exports = apiRoutes;