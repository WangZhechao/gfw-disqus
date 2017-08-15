var apiRoutes = {
	'get /': {view: C.home.browse},
	'post /comment': {json: C.comment.create},
	'get /listPosts': {json: C.comment.list},
	'get /gravatar': {json: C.gravatar.get}
};

module.exports = apiRoutes;