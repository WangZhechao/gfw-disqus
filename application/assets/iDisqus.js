/*!
 * v 0.1.5
 * https://github.com/fooleap/disqus-php-api
 *
 * Copyright 2017 fooleap
 * Released under the MIT license
 */
(function (global) {
    'use strict';

    var d = document,
        l = localStorage;

    if (typeof Object.create !== "function") {
        Object.create = function (proto, propertiesObject) {
            if (!(proto === null || typeof proto === "object" || typeof proto === "function")) {
                throw TypeError('Argument must be an object, or null');
            }
            var temp = new Object();
            temp.__proto__ = proto;
            if(typeof propertiesObject ==="object")
                Object.defineProperties(temp,propertiesObject);
            return temp;
        };
    }

if (!document.addEventListener) {
    // IE6~IE8
    document.write('<script src="ieBetter.js"><\/script>'); 
}

    function getLocation(href) {
        var link = d.createElement('a');
        link.href = href;
        return link;
    }


    function GFWError(message) {
        this.name = 'GFWError';
        this.message = message || 'ajax error';
        this.stack = (new Error()).stack;
    }
    GFWError.prototype = Object.create(Error.prototype);
    GFWError.prototype.constructor = GFWError;


    function getAjax(url, cb) {
        var xhr = null;
        if (window.XMLHttpRequest) {
            // 非IE内核  
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            // IE内核,这里早期IE的版本写法不同,具体可以查询下  
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        } else {
            return cb && cb(new GFWError('xhr does not exist'));
        }

        //xhr.timeout = 3000;
        xhr.onerror = function(err) {
            return cb && cb(err);
        }
        xhr.open('GET', encodeURI(url));
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                return cb && cb(null, xhr.responseText);
            }
        };

        xhr.send();

        return xhr;
    }


    function postAjax(url, data, success, error) {
        var params = typeof data == 'string' ? data : Object.keys(data).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
        ).join('&');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                success(xhr.responseText); 
            }
        };
        xhr.onerror = error; 
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
        return xhr;
    }
    
    function addListener(els, evt, func){
        [].forEach.call(els, function(item){
            item.addEventListener(evt, func, false);
        });
    }

    function removeListener(els, evt, func){
        [].forEach.call(els, function(item){
            item.removeEventListener(evt, func, false);
        });
    }

    // TimeAgo https://coderwall.com/p/uub3pw/javascript-timeago-func-e-g-8-hours-ago
    function timeAgo(selector) {

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

        var elements = document.getElementsByClassName('timeago');
        for (var i in elements) {
            var $this = elements[i];
            if (typeof $this === 'object') {
                $this.innerHTML = timer($this.getAttribute('title') || $this.getAttribute('datetime'));
            }
        }
        // update time every minute
        setTimeout(timeAgo, 60000);

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

    // 访客信息
    var Guest = function () {
        this.dom = arguments[0];
        this.init();
    }

    Guest.prototype = {
        // 初始化访客信息
        init: function(){
            var _ = this;
            // 读取访客信息
            _.name = l.getItem('name');
            _.email = l.getItem('email');
            _.url = l.getItem('url');
            _.avatar = l.getItem('avatar');
            _.logged_in = l.getItem('logged_in');

            var boxarr = _.dom.getElementsByClassName('comment-box');
            if( _.logged_in == 'true' ) {
                [].forEach.call(boxarr,function(item){
                    item.querySelector('.comment-form-wrapper').classList.add('logged-in');
                    item.querySelector('.comment-form-name').value = _.name;
                    item.querySelector('.comment-form-email').value = _.email;
                    item.querySelector('.comment-form-url').value = _.url;
                    item.querySelector('.comment-avatar-image').src = _.avatar;
                });
            } else {
                [].forEach.call(boxarr,function(item){
                    item.querySelector('.comment-form-wrapper').classList.remove('logged-in');
                    item.querySelector('.comment-form-name').value = _.name;
                    item.querySelector('.comment-form-email').value = _.email;
                    item.querySelector('.comment-form-url').value = _.url;
                    item.querySelector('.comment-avatar-image').src = !!_.avatar ? _.avatar : item.querySelector('.comment-avatar-image').src;
                });
                l.setItem('logged_in', 'false');
            }
        },

        // 重置访客信息
        reset: function(){
            l.setItem('logged_in', 'false');
            this.init();
        },

        // 提交访客信息
        submit: function(g){
            if( this.logged_in == 'false' ){
                l.setItem('name', g.name);
                l.setItem('email', g.email);
                l.setItem('url', g.url);
                l.setItem('avatar', g.avatar);
                l.setItem('logged_in', 'true');
                this.init();
            }
        }
    }

    var iDisqus = function () {
        var _ = this;

        // 配置
        _.opts = {};
        _.dom = d.getElementById('gfw-comment');
        if(!_.dom.getElementsByClassName) {
            _.dom.getElementsByClassName = document.getElementsByClassName;
        }
        _.opts.api = '';
        _.opts.ident = d.getElementById('disqus-ident').innerHTML || '';
        _.opts.link = d.getElementById('disqus-link').innerHTML || '';
        _.opts.title = d.getElementById('disqus-title').innerHTML || '';


        // 默认状态
        _.stat = {
            loaded: false,      // 评论框已加载
            loading: false,     // 评论加载中
            offsetTop: 0,       // 高度位置
            threadID: null,     // 本页 thread id
            next: null,         // 下条评论
            message: null,      // 新评论
            mediaHtml: null,    // 新上传图片
            unload: [],         // 未加载评论
            root: [],           // 根评论
            count: 0,           // 评论数
            imageSize: []       // 已上传图片大小
        };

        // 自动初始化
        _.init();
    }


    // 初始化评论框
    iDisqus.prototype.init = function(){
        var _ = this;
        if(!_.dom){
            //console.log('该页面没有评论框！');
            return
        }

        _.guest = new Guest(_.dom);
        _.box = _.dom.querySelector('.comment-box').outerHTML.replace(/<label class="comment-actions-label exit"(.|\n)*<\/label>\n/,'').replace('comment-form-wrapper','comment-form-wrapper editing').replace(/加入讨论……/,'');
        _.handle = {
            guestReset: _.guest.reset.bind(_.guest),
            loadMore: _.loadMore.bind(_),
            post: _.post.bind(_),
           // remove: _.remove.bind(_),
            show: _.show.bind(_),
            verify: _.verify.bind(_),
            field: _.field,
            focus: _.focus,
            input: _.input
        };


        _.getlist();
    }


    // 获取评论列表
    iDisqus.prototype.getlist = function(){
        var _ = this;
        _.stat.loading = true;
        _.dom.querySelector('#idisqus').style.display = 'block';
        getAjax(
            _.opts.api + '/listPosts?ident=' + _.opts.ident + '&link=' + _.opts.link + (!!_.stat.next ? '&cursor=' + _.stat.next : ''),
            

            function(err, resp) {
                if(err) {
                    console.log('获取评论列表出错！');
                    return;
                }


                var data = null;
                try {
                    data = JSON.parse(resp);
                } catch(e) {
                    data = null;
                }

                if(!data) {
                    console.log('解析json错误！');
                    return;
                }


                if((!data.success) || (!data.thread)) {
                    console.log(data.errors[0].message);
                    return;
                }


                //设置评论框
                _.stat.offsetTop = d.documentElement.scrollTop || d.body.scrollTop;
                _.stat.threadID = data.thread.id;
                _.stat.count = data.thread.posts.length;
                _.dom.querySelector('#idisqus').classList.remove('loading');
               // _.dom.querySelector('#comment-link').href = data.link;
                _.dom.querySelector('#comment-count').innerHTML = ~~_.stat.count > 0 ? (_.stat.count + ' 条评论') : ('暂无评论');

                var loadmore = _.dom.querySelector('.comment-loadmore');
                var posts = _.stat.unload.length > 0 ? data.thread.posts.concat(_.stat.unload) : (data.thread.posts.length > 0 ? data.thread.posts : []);
                _.stat.unload = [];
                _.stat.root = [];
                posts.forEach(function(item){
                    _.load(item);
                    if(!item.parent){
                        _.stat.root.unshift(item.id);
                    }
                });

                if ( data.thread.cursor.hasPrev ){
                    _.stat.root.forEach(function(comment_id){
                        _.dom.querySelector('.comment-list').appendChild(_.dom.querySelector('#comment-' + comment_id));
                    })
                } else {
                    loadmore.addEventListener('click', _.handle.loadMore, false);
                    _.dom.querySelector('.exit').addEventListener('click', _.handle.guestReset, false);
                    _.dom.querySelector('.comment-form-textarea').addEventListener('blur', _.handle.focus, false);
                    _.dom.querySelector('.comment-form-textarea').addEventListener('focus',_.handle.focus, false);
                    _.dom.querySelector('.comment-form-textarea').addEventListener('input', _.handle.input, false);
                    _.dom.querySelector('.comment-form-email').addEventListener('blur', _.handle.verify, false);
                    _.dom.querySelector('.comment-form-submit').addEventListener('click', _.handle.post, false);
                 //   _.dom.querySelector('.comment-image-input').addEventListener('change', _.handle.upload, false);
                }
                if ( data.thread.cursor.hasNext ){
                    _.stat.next = data.thread.cursor.next;
                    loadmore.classList.remove('loading');
                } else {
                    _.stat.next = null;
                    loadmore.classList.add('hide');
                }

                if (posts.length == 0) {
                    return;
                }

                window.scrollTo(0, _.stat.offsetTop);

                timeAgo();

                if (/^#disqus|^#comment/.test(location.hash) && !data.thread.cursor.hasPrev ) {
                    window.scrollTo(0, _.dom.querySelector(location.hash).offsetTop);
                }

                _.stat.loading = false;
                _.stat.loaded = true;
            }
        );
    }


    // 读取评论
    iDisqus.prototype.load = function(post){

        var _ = this;

        var parentPost = !post.parent ? {
            name: '',
            dom: _.dom.querySelector('.comment-list'),
            insert: 'afterbegin'
        } : {
            name: !!_.dom.querySelector('.comment-item[data-id="'+post.parent+'"]') ? '<a class="at" href="#'+_.dom.querySelector('.comment-item[data-id="'+post.parent+'"]').id+'">@' + _.dom.querySelector('.comment-item[data-id="'+post.parent+'"]').dataset.name + '</a>': '',
            dom: _.dom.querySelector('.comment-item[data-id="'+post.parent+'"] .comment-item-children'),
            insert: 'beforeend'
        };

        if (!!parentPost.dom) {
            var mediaHTML = '';
            post.media.forEach(function(item){
                mediaHTML += '<a class="comment-item-imagelink" target="_blank" href="' + item + '" ><img class="comment-item-image" src="' + item + '?imageView2/2/h/200"></a>';
            })
            mediaHTML = '<div class="comment-item-images">' + mediaHTML + '</div>';

            var html = '<li class="comment-item" data-id="' + post.id + '" data-name="'+ post.name + '" id="comment-' + post.id + '">' +
                '<div class="comment-item-avatar"><img src="' + post.avatar + '"></div>'+
                '<div class="comment-item-main">'+
                '<div class="comment-item-header"><a class="comment-item-name" title="' + post.name + '" rel="nofollow" target="_blank" href="' + ( post.url ? post.url : 'javascript:;' ) + '">' + post.name + '</a><span class="comment-item-bullet"> • </span><span class="comment-item-time timeago" datetime="' + post.createdAt + '"></span><span class="comment-item-bullet"> • </span><a class="comment-item-reply" href="javascript:;">回复</a></div>'+
                '<div class="comment-item-content">' + post.message + mediaHTML + '</div>'+
                '<ul class="comment-item-children"></ul>'+
                '</div>'+
                '</li>';
            parentPost.dom.insertAdjacentHTML(parentPost.insert, html);
            _.dom.querySelector('.comment-item[data-id="' + post.id + '"] .comment-item-reply').addEventListener('click', _.handle.show, false);
        } else {
            _.stat.unload.push(post);
        }
    }

    // 读取更多
    iDisqus.prototype.loadMore = function(e){
        var _ = this;
        if( !_.stat.loading ){
            e.currentTarget.classList.add('loading');
            _.getlist();
        }
    }

    // 评论框焦点
    iDisqus.prototype.focus = function(e){
        var wrapper = e.currentTarget.closest('.comment-form-wrapper');
        wrapper.classList.add('editing');
        if (wrapper.classList.contains('focus')){
            wrapper.classList.remove('focus');
        } else{
            wrapper.classList.add('focus');
        }
    }

    // 输入事件
    iDisqus.prototype.input = function(e){
        var form = e.currentTarget.closest('.comment-form');
        var alertmsg = form.querySelector('.comment-form-alert');
        alertmsg.innerHTML = '';
    }


    // 回复框
    iDisqus.prototype.show = function(e){
        var _ = this;

        // 移除已显示回复框
        var box = _.dom.querySelector('.comment-item .comment-box');
        if( box ){
            var $show = box.closest('.comment-item');
            box.parentNode.removeChild(box);
            var cancel = $show.querySelector('.comment-item-cancel')
            cancel.outerHTML = cancel.outerHTML.replace('cancel','reply');
            $show.querySelector('.comment-item-reply').addEventListener('click', _.handle.show, false);
        }

        // 显示回复框
        var $this = e.currentTarget;
        var item = $this.closest('.comment-item');
        var commentBox = _.box.replace(/upload-input/g,'upload-input-'+item.dataset.id);
        item.querySelector('.comment-item-children').insertAdjacentHTML('beforebegin', commentBox);
        $this.outerHTML = $this.outerHTML.replace('reply','cancel');
        _.guest.init();

        item.querySelector('.comment-form-textarea').addEventListener('blur', _.handle.focus, false);
        item.querySelector('.comment-form-textarea').addEventListener('focus', _.handle.focus, false);
        item.querySelector('.comment-form-textarea').addEventListener('input', _.handle.input, false);
        item.querySelector('.comment-form-email').addEventListener('blur', _.handle.verify, false);
        item.querySelector('.comment-form-submit').addEventListener('click', _.handle.post, false);
        item.querySelector('.comment-form-textarea').focus();

        // 取消回复
        item.querySelector('.comment-item-cancel').addEventListener('click', function(){
            item.querySelector('.comment-box').outerHTML = '';
            this.outerHTML = this.outerHTML.replace('cancel','reply');
            item.querySelector('.comment-item-reply').addEventListener('click', _.handle.show, false);
        }, false);
    }


    // 验证表单
    iDisqus.prototype.verify = function(e){
        var _ = this;
        var box  = e.currentTarget.closest('.comment-box');
        var avatar = box.querySelector('.comment-avatar-image');
        var email = box.querySelector('.comment-form-email');
        var alertmsg = box.querySelector('.comment-form-alert');
        if (/^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i.test(email.value)) {
            getAjax(
                _.opts.api + '/gravatar?email=' + email.value,
                function(err, resp) {
                    if(err) {
                        return;
                    }

                    var data = null;
                    try {
                        data = JSON.parse(resp);
                    } catch(e) {
                        data = null;
                    }

                    if(!data) {
                        return;
                    }

                    if (!data.success) {
                        _.errorTips(data.errors[0].message, email);
                    } else {
                        avatar.src = data.gravatar;
                    }
                }
            );
        }
    }


    // 错误提示
    iDisqus.prototype.errorTips = function(Text, Dom){
        var _ = this;
        if( _.guest.logged_in == 'true' ){
            _.guest.reset();
        }
        var idisqus = _.dom.querySelector('#idisqus');
        var errorDom = _.dom.querySelector('.comment-form-error');
        if(!!errorDom){
            errorDom.outerHTML = '';
        }
        var Top = Dom.offsetTop;
        var Left = Dom.offsetLeft;
        var errorHtml = '<div class="comment-form-error" style="top:'+Top+'px;left:'+Left+'px;">'+Text+'</div>';
        idisqus.insertAdjacentHTML('beforeend', errorHtml);
        errorDom
        setTimeout(function(){
            var errorDom = _.dom.querySelector('.comment-form-error');
            if(!!errorDom){
                errorDom.outerHTML = '';
            }
        }, 3000);
    }

    // 发表/回复评论
    iDisqus.prototype.post = function(e){
        var _ = this;
        var item = e.currentTarget.closest('.comment-item') || e.currentTarget.closest('.comment-box');
        var elName = item.querySelector('.comment-form-name');
        var elEmail = item.querySelector('.comment-form-email');
        var elUrl = item.querySelector('.comment-form-url');
        var guest = {
            name: elName.value,
            email: elEmail.value,
            url: elUrl.value.replace(/\s/g,''),
            avatar: item.querySelector('.comment-avatar-image').src
        }
        var alertmsg = item.querySelector('.comment-form-alert');
        function alertClear(){
            setTimeout(function(){
                alertmsg.innerHTML = '';
            }, 3000);
        }

        if(/^\s*$/i.test(guest.name)){
            _.errorTips('名字不能为空。', elName);
            return;
        }
        if(/^\s*$/i.test(guest.email)){
            _.errorTips('邮箱不能为空。', elEmail);
            return;
        }
        if(!/^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i.test(guest.email)){
            _.errorTips('请正确填写邮箱。', elEmail);
            return;
        }
        if(!/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$|^\s*$/i.test(guest.url)){
            _.errorTips('请正确填写网址。', elUrl);
            return;
        }
        _.guest.submit(guest);

        if(!_.stat.message && !_.stat.mediaHtml){
            _.box = _.dom.querySelector('.comment-box').outerHTML.replace(/<label class="comment-actions-label exit"(.|\n)*<\/label>\n/,'').replace('comment-form-wrapper','comment-form-wrapper editing').replace(/加入讨论……/,'');
        }

        var message = item.querySelector('.comment-form-textarea').value;
        var parentId = !!item.dataset.id ? item.dataset.id : '';
        var imgArr = item.getElementsByClassName('comment-image-item');
        var media = [];
        var mediaStr = '';
        [].forEach.call(imgArr, function(image,i){
            media[i] = image.dataset.imageUrl;
            mediaStr += ' ' + image.dataset.imageUrl;
        });

        if( !_.guest.name && !_.guest.email ){
            return;
        }

        if( media.length == 0 && /^\s*$/i.test(message)){
            alertmsg.innerHTML = '评论不能为空或空格。';
            item.querySelector('.comment-form-textarea').focus();
            return;
        };


        var post = {
            'url': !!_.guest.url ? _.guest.url : '',
            'name': _.guest.name,
            'avatar': _.guest.avatar,
            'id': 'preview',
            'parent': parentId,
            'createdAt': (new Date()).toJSON(),
            'message': '<p>' + message + '</p>',
            'media': media
        };
        

        _.load(post);

        _.stat.message = message;
        _.stat.mediaHtml = item.querySelector('.comment-image-list').innerHTML;

        timeAgo();

        message += mediaStr;

        // 清空或移除评论框
        if( parentId ){
            item.querySelector('.comment-item-cancel').click();
        } else {
            item.querySelector('.comment-form-textarea').value = '';
            item.querySelector('.comment-image-list').innerHTML = '';
            item.querySelector('.comment-form-wrapper').classList.remove('expanded','editing');
        }

        // POST 操作
        var postData = {
            thread:  _.stat.threadID,
            parent: parentId,
            message: message,
            name: _.guest.name,
            email: _.guest.email,
            url:  _.guest.url,
            link: _.opts.link,
            title: _.opts.title
        }


        postAjax( _.opts.api + '/comment', postData, function(resp){

            var data = null;
            try {
                data = JSON.parse(resp);
            } catch(e) {
                data = null;
            }

            if(!data) {
                alertmsg.innerHTML = '解析json错误！';
                return;
            }


            var preview = _.dom.querySelector('.comment-item[data-id="preview"]');
            preview.parentNode.removeChild(preview);

            if(data.success) {
                _.dom.querySelector('#comment-count').innerHTML = (++_.stat.count) + ' 条评论';
                _.load(data.post);
                _.stat.message = null;
                _.stat.mediaHtml = null;

                timeAgo();                
            } else {
                alertmsg.innerHTML = data.errors[0].message;
                return;
            }
        }, function(){
            alertmsg.innerHTML = '提交出错，请稍后重试。';
            alertClear();

            _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
            if( parentId ){
                item.querySelector('.comment-item-reply').click();
            } else {
                item.querySelector('.comment-form-wrapper').classList.add('editing');
            }
            item.querySelector('.comment-form-textarea').value = _.stat.message;
            if(!!_.stat.mediaHtml){
                item.querySelector('.comment-form-wrapper').classList.add('expanded');
                item.querySelector('.comment-image-list').innerHTML = _.stat.mediaHtml;
                addListener(item.getElementsByClassName('comment-image-item'), 'click', _.remove.bind(_));
            }
        });
    }


    // 销毁评论框
    iDisqus.prototype.destroy = function(){
        var _ = this;
        _.dom.querySelector('.exit').removeEventListener('click', _.handle.guestReset, false);
        removeListener(_.dom.getElementsByClassName('comment-form-textarea'), 'blur', _.handle.focus);
        removeListener(_.dom.getElementsByClassName('comment-form-textarea'), 'focus', _.handle.focus);
        removeListener(_.dom.getElementsByClassName('comment-form-email'), 'blur', _.handle.verify);
        removeListener(_.dom.getElementsByClassName('comment-form-submit'), 'click', _.handle.post);
        removeListener(_.dom.getElementsByClassName('comment-item-reply'), 'click', _.handle.show);
        removeListener(_.dom.getElementsByClassName('comment-loadmore'), 'click', _.handle.loadMore);
        removeListener(_.dom.getElementsByClassName('emojione-item'), 'click', _.handle.field);
        _.dom.innerHTML = '';
        delete _.box;
        delete _.dom;
       // delete _.emoji;
        delete _.guest;
        delete _.handle;
        delete _.opts;
        delete _.stat;
    }

    /* CommonJS */
    if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
        module.exports = iDisqus;
    /* AMD */
    else if (typeof define === 'function' && define['amd'])
        define(function () {
            return iDisqus;
        });
    /* Global */
    else
        global['iDisqus'] = global['iDisqus'] || iDisqus;

})(window || this);
