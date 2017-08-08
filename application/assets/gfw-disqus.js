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

    // matches & closest polyfill https://github.com/jonathantneal/closest
    (function (ElementProto) {
        if (typeof ElementProto.matches !== 'function') {
            ElementProto.matches = ElementProto.msMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.webkitMatchesSelector || function matches(selector) {
                var element = this;
                var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
                var index = 0;

                while (elements[index] && elements[index] !== element) {
                    ++index;
                }

                return Boolean(elements[index]);
            };
        }

        if (typeof ElementProto.closest !== 'function') {
            ElementProto.closest = function closest(selector) {
                var element = this;

                while (element && element.nodeType === 1) {
                    if (element.matches(selector)) {
                        return element;
                    }

                    element = element.parentNode;
                }

                return null;
            };
        }
    })(window.Element.prototype);


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


    	this.padding = [80, 10, 20, 0]; //上右下左
    	this.elementId = elementId;
    	this.stage = acgraph.create(elementId);
        this.width = 0;
        this.currentReply = null;
        
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
    			if(!(resp.success && resp.data)) {
    				console.log(resp.errors[0].message);
                    return;
    				//return cb && cb()
    			}

    			self.id = resp.data.id;
    			self.isClosed = resp.data.isClosed;
    			self.slug = resp.data.slug;
    			self.likes = resp.data.likes;
    			self.postTotal = resp.data.postTotal;
    			self.cursor = resp.data.cursor;

    			self.addChildren(resp.data.posts);

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

        var zeros = '000';
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
    					self.postMap[posts[index].id]._sortFlag = self.postMap[posts[index].parent]._sortFlag + '.'  + (zeros + self.postMap[posts[index].parent].children.length).slice(-zeros.length);
    					self.flagArray.push (self.postMap[posts[index].id]._sortFlag);
    					self.flagMap[self.postMap[posts[index].id]._sortFlag] = posts[index].id;
    					self.postMap[posts[index].parent].children.push(posts[index].id);
    				} else {
    					console.log('父节点不存在！');
    				}    				
    			} else {
    				self.postMap[posts[index].id]._sortFlag = self._sortFlag + (zeros + self.children.length).slice(-zeros.length);
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

        //绘制信息概览
        var linePath = acgraph.path().parent(self.stage);
        linePath.moveTo(0, y);
        linePath.lineTo(self.stage.width(), y);
        linePath.stroke({color: '#e7e9ee'}, 2);

        var lineHot = acgraph.path().parent(self.stage);
        lineHot.moveTo(0, y);
        lineHot.lineTo(90, y);
        lineHot.stroke({color: "#2196F3"}, 3);

        var boldfontStyle = {
            fontSize: '17px',
            fontWeight: 'bold',
            fontFamily: '"Helvetica Neue",arial,"Microsoft YaHei", sans-serif',
            color: '#656c7a',
            letterSpacing: '0.5px'
        }
        var commentCount = acgraph.text(5, y - 25, self.postTotal + ' 条评论', boldfontStyle).parent(self.stage);
        var commentDisqus = acgraph.text(self.stage.width() - 135, y - 25, 'Disqus 讨论区', boldfontStyle).parent(self.stage);


        y += 10;
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
        this.width = size.width || 0;

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


        //错误提示宽度
        var errorTip = _dom.querySelector('.error-info-tip');
        if(errorTip) {
            errorTip.style.width = (size.width - 150) + 'px';
        }
    }

    function errorTip(msg) {
        var errTip = _dom.querySelector('.error-info-tip');
        if(errTip) {
            if(msg) {
                errTip.innerHTML = '*' + msg;                
            } else {
                errTip.innerHTML = '';
            }
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

                '<div class="error-info-tip"></div>' + 

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


    function input() {
        errorTip();
    }


    function submitPost(e) {
        var self = this;
        var elBtn = e.currentTarget;
        var item = e.currentTarget.closest('.comment-item') || e.currentTarget.closest('.comment-box');
        var elName = item.querySelector('.comment-form-name');
        var elEmail = item.querySelector('.comment-form-email');
        var elUrl = item.querySelector('.comment-form-url');
        var guest = {
            name: elName.value,
            email: elEmail.value,
            url: elUrl.value.replace(/\s/g,'')
        }


        if(/^\s*$/i.test(guest.name)){
            errorTip('名字不能为空。');
            return;
        }
        if(/^\s*$/i.test(guest.email)){
            errorTip('邮箱不能为空。');
            return;
        }
        if(!/^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i.test(guest.email)){
            errorTip('请正确填写邮箱。');
            return;
        }
        if(!/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$|^\s*$/i.test(guest.url)){
            errorTip('请正确填写网址。');
            return;
        }


        var message = item.querySelector('.comment-form-textarea').value;
        if(message.trim() === '') {
            errorTip('评论内容不可为空。');
            return;
        }


        var parentId = self.currentReply;
        var media = [];

        // POST 操作
        var postData = {
            thread:  self.id,
            parent: parentId,
            message: message,
            name: guest.name,
            email: guest.email,
            url: guest.url
        }


        if(elBtn) {
            elBtn.disabled = true;
        }

        reqwest({
            url: '/comment',
            method: 'post',
            data: postData,
            success: function(resp) {
                if(!resp.success) {
                    errorTip(resp.errors[0].message);
                    return;
                }

                self.postTotal ++;
                self.addChildren([resp.data]);

                var size = self.render();
                self.changeSize(size);
            },

            error: function(err) {
                errorTip(err.message);
            },

            complete: function() {
                if(elBtn) {
                    elBtn.disabled = false;
                }
            }
        })
    }


    function loadJS() {
        var thread = new Thread('comment-list');
        thread.load({ident: 'ghost-5971becb4ab6c014a0b1f7c6'}, function(err, thread) {
            if(err) {
                return;
            }

            var size = thread.render();
            thread.changeSize(size);

            console.log(thread);
        });


        _dom.querySelector('.comment-form-textarea').addEventListener('input', input, false);
        _dom.querySelector('.comment-form-name').addEventListener('input', input, false);
        _dom.querySelector('.comment-form-email').addEventListener('input', input, false);
        _dom.querySelector('.comment-form-url').addEventListener('input', input, false);
        _dom.querySelector('.comment-form-submit').addEventListener('click', submitPost.bind(thread), false);
    }


    //加载css
    loadCSS('/css/gfw-disqus.css');

    //加载html
    loadHTML();

    //加载js
    loadJS();


})(window);