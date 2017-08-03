var apiRoutes = {
	'get /': {view: C.home.browse},
	'get /comments': {view: C.comment.browse},
	'post /comment': {json: C.comment.create},
	'get /listPosts': {json: C.post.list},
	'get /gravatar': {json: C.gravatar.get}
};

module.exports = apiRoutes;