(function (window) {
    'use strict';


    if (!Object.keys) Object.keys = function(o) {
      if (o !== Object(o))
        throw new TypeError('Object.keys called on a non-object');
      var k=[],p;
      for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) k.push(p);
      return k;
    }

    function formatTime(iosTime) {

        var templates = {
            prefix: "",
            suffix: "前",
            seconds: "几秒",
            minute: "1分钟",
            minutes: "%d分钟",
            hour: "1小时",
            hours: "%d小时",
            day: "1天",
            days: "%d天",
            month: "1个月",
            months: "%d个月",
            year: "1年",
            years: "%d年"
        };
        var template = function (t, n) {
            return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
        };

        var timer = function (time) {
            if (!time) return;
            time = time.replace(/\.\d+/, ""); // remove milliseconds
            time = time.replace(/-/, "/").replace(/-/, "/");
            time = time.replace(/T/, " ").replace(/Z/, " UTC");
            time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
            time = new Date(time * 1000 || time);

            var now = new Date();
            var seconds = ((now.getTime() - time) * .001) >> 0;
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var years = days / 365;

            return templates.prefix + (
                seconds < 45 && template('seconds', seconds) || seconds < 90 && template('minute', 1) || minutes < 45 && template('minutes', minutes) || minutes < 90 && template('hour', 1) || hours < 24 && template('hours', hours) || hours < 42 && template('day', 1) || days < 30 && template('days', days) || days < 45 && template('month', 1) || days < 365 && template('months', days / 30) || years < 1.5 && template('year', 1) || template('years', years)) + templates.suffix;
        };

        return timer(iosTime);
    }


    var AVATAR_SIZE = 48;
    var SPACE_SIZE = 12;

    var UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;


    var _dom = document.getElementById('container');

    /*
     * 楼，对应disqus内部Thread
     */
    function Thread(elementId) {
    	this.id = '';
    	this.isClosed = false;
    	this.slug = '';
    	this.likes = 0;
    	this.postTotal = 0;	//文章总数 >= posts.length
    	this.cursor = {};

    	
    	this._sortFlag = '';
    	this.children = [];	//孩子节点（不包括孙子后）
    	this.flagArray = []; //标记数组
    	this.flagMap = {}; //排序标记映射
    	this.postMap = {}; //保存数据，确认只有一次，并且迅速定位


    	this.padding = [20, 10, 20, 0]; //上右下左
    	this.elementId = elementId;
    	this.stage = acgraph.create(elementId);
        
        var self = this;
        this.stage.listen("stageresize", function(){
            self.changeSize({
                width: self.stage.width(), 
                height: self.stage.height()
            });
        });
    };

    //加载信息
    Thread.prototype.load = function(opts, cb) {

    	var self = this,
    		url = '/listPosts?' 
    				+ (!!opts.ident ? ('ident=' + opts.ident) : '')
    				+ (!!opts.link ? ('&link=' + opts.link) : '')
    				+ (!!this.cursor.hasNext ? ('&cursor=' + this.cursor.next) : '');

    	reqwest({
    		url: url,
    		method: 'get',
    		success: function(resp) {
    			if(!(resp.success && resp.thread)) {
    				console.log(resp.errors[0].message);
                    return;
    				//return cb && cb()
    			}

    			self.id = resp.thread.id;
    			self.isClosed = resp.thread.isClosed;
    			self.slug = resp.thread.slug;
    			self.likes = resp.thread.likes;
    			self.postTotal = resp.thread.postTotal;
    			self.cursor = resp.thread.cursor;

    			self.addChildren(resp.thread.posts);

                return cb && cb(null, self);
    		},

    		error: function(err) {
    			console.log('err', err);
                return cb && cb(err);
    		}
    	});
    };


    //加入信息
    Thread.prototype.addChildren = function(posts) {
    	var self = this,
    		count = (posts || []).length,
    		index;

    	if(count <= 0) {
    		return;
    	}

    	for(index=0; index<count; index++) {
    		//已经存在
    		if(self.postMap[posts[index].id]) {
    			console.log('已经存在！');
    		} else {
    			self.postMap[posts[index].id] = posts[index];
    			self.postMap[posts[index].id].children = [];

    			//如果存在父节点
    			if(posts[index].parent) {
    				if(self.postMap[posts[index].parent]) {
    					self.postMap[posts[index].id]._sortFlag = self.postMap[posts[index].parent]._sortFlag + '.'  + self.postMap[posts[index].parent].children.length;
    					self.flagArray.push(self.postMap[posts[index].id]._sortFlag);
    					self.flagMap[self.postMap[posts[index].id]._sortFlag] = posts[index].id;
    					self.postMap[posts[index].parent].children.push(posts[index].id);
    				} else {
    					console.log('父节点不存在！');
    				}    				
    			} else {
    				self.postMap[posts[index].id]._sortFlag = self._sortFlag + self.children.length;
    				self.flagArray.push(self.postMap[posts[index].id]._sortFlag);
    				self.flagMap[self.postMap[posts[index].id]._sortFlag] = posts[index].id;
    				self.children.push(posts[index].id);
    			}
    		}
    	}
    };


    Thread.prototype.renderPost = function(px, py, post) {
    	var self = this,
    		width = self.stage.width() - self.padding[LEFT] - self.padding[RIGHT],
    		author = post.author,
    		left = AVATAR_SIZE + SPACE_SIZE,
    		boldfontStyle = {
				fontSize: '13px',
				fontWeight: '700',
				fontFamily: '"Helvetica Neue",arial,sans-serif',
				color: '#656c7a'
    		}, 
    		smallFontStyle = {
				fontSize: '12px',
				fontWeight: 'normal',
				fontFamily: '"Helvetica Neue",arial,sans-serif',
				color: '#656c7a'
    		},
    		bigFontStyle = {
				fontSize: '14px',
				fontFamily : '"Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif',
				color: '#2a2e2e',
				textWrap: 'byLetter',
				letterSpacing: '0.435px'
    		}, 
    		x = 0, y = 0;

    	var layer = acgraph.layer().setPosition(px, py).parent(self.stage);
    	var avatar = acgraph.image(author.avatar, x, y, AVATAR_SIZE, AVATAR_SIZE).parent(layer);

    	x += left;
    	var name = acgraph.text(x, y, author.name, boldfontStyle).parent(layer);
    	if(author.url) {
    		name.color('rgb(46, 169, 223)');
    		name.cursor('pointer');
    		name.listen("click", function (e) {
    			window.open(author.url);
    		});
    	}

    	x += name.getWidth();

    	//回复引用标记
    	if(post.parent) {
    		var replyIcon = acgraph.image('/images/reply.png', x, y, 15, 15).parent(layer);

    		x += 17;
    		var parentName = acgraph.text(x, y, self.postMap[post.parent].author.name, smallFontStyle).parent(layer);
    		x += parentName.getWidth();
    	}


    	x += 5;
    	var bullet = acgraph.text(x, y, '•', boldfontStyle).parent(layer);
    	x += 5;


    	x += bullet.getWidth();


    	var time = formatTime(post.createdAt);
    	var timeAgo = acgraph.text(x, y, time, smallFontStyle).parent(layer);


    	x = left;
    	y = name.getHeight() + 10;
    	var message = acgraph.text(x, y).parent(layer);
    	message.style(bigFontStyle);
    	message.width(width);
    	message.htmlText(post.message);


    	x = left;
    	y += message.getHeight() + 5;
    	var reply = acgraph.text(x, y, '回复', boldfontStyle).parent(layer);

    	return layer.getHeight();
    };


    //渲染信息
    Thread.prototype.render = function() {
    	var i, len, post, x, y, self = this,
    		sortFlag = self.flagArray.sort().reverse();

    	if(!self.stage) {
    		return;
    	}
    	

    	self.stage.suspend();

    	y = self.padding[UP]; //上
    	self.stage.removeChildren();
    	for(i=0,len=sortFlag.length; i<len; i++) {
    		post = self.postMap[self.flagMap[sortFlag[i]]];

    		//左 + 
    		x = self.padding[LEFT] + ((post._sortFlag || '').split('.').length - 1) * AVATAR_SIZE;

    		y += self.renderPost(x, y, post) + 10;
    	}

    	self.stage.resume();

        return {
            width: (self.stage.width() - self.padding[LEFT] - self.padding[RIGHT]),
            height: (y + self.padding[DOWN])
        };
    };


    Thread.prototype.changeSize = function(size) {
        console.log(size);
        if(size.width <= 0 || size.height <= 0) 
            return;

        //设定评论列表高度
        var commentList = document.getElementById(this.elementId);
        if(commentList) {
            commentList.style.height = size.height + 'px';
          //  commentList.style.width = size.width + 'px';
        }


        //评论框的宽度
        var commentForm = _dom.querySelector('.comment-form');
        if(commentForm) {
            commentForm.style.width = (size.width /*- AVATAR_SIZE - SPACE_SIZE*/) + 'px';
        }
    }

    function loadCSS(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }


    function loadHTML() {
        if(!_dom) {
            return;
        }

        _dom.innerHTML = '<div class="comment-box">' + 
            // '<div class="comment-avatar avatar">' + 
            //     '<img class="comment-avatar-image" src="./images/noavatar92.png">' + 
            // '</div>' + 
            '<div class="comment-form">' + 
                '<div class="comment-form-wrapper">' + 
                    '<textarea class="comment-form-textarea" placeholder="加入讨论……"></textarea>' + 
                '</div>' + 

                '<div class="comment-login">' + 
                    '<input class="comment-form-input comment-form-name" type="text" placeholder="名字（必填）" autocomplete="name">' + 
                    '<input class="comment-form-input comment-form-email" type="email" placeholder="邮箱（必填）" autocomplete="email">' + 
                    '<input class="comment-form-input comment-form-url" type="url" placeholder="网址（可选）" autocomplete="url">' + 
                '</div>' + 

                '<div class="comment-actions-form">' + 
                    '<button class="comment-form-submit">' + 
                        '<svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">' + 
                            '<path d="M565.747623 792.837176l260.819261 112.921839 126.910435-845.424882L66.087673 581.973678l232.843092 109.933785 562.612725-511.653099-451.697589 563.616588-5.996574 239.832274L565.747623 792.837176z" fill="#ffffff"></path>' + 
                        '</svg>' + 
                    '</button>' + 
                '</div>' + 
            '</div>' + 
        '</div>' + 

        '<div id="comment-list">' + 
        '</div>';
    }


    function loadJS() {
        var thread = new Thread('comment-list');
        thread.load({ident: 'ghost-5971becb4ab6c014a0b1f7c6'}, function(err, thread) {
            if(err) {
                return;
            }

            var size = thread.render();
            thread.changeSize(size);
        });
    }


    //加载css
    loadCSS('/css/gfw-disqus.css');

    //加载html
    loadHTML();

    //加载js
    loadJS();


})(window);