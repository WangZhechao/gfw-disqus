;(function( window ){
  'use strict';

function loadScript(url, cb) {
	var callback, handle;
    var script = document.createElement("script");
    script.type = "text/javascript";


    //设置超时时间
    handle = setTimeout(function() {
    	return callback && callback('timeout');
    }, 2000);


	//回调
    callback = function(err) {
    	clearTimeout(handle);
    	callback = handle = null;
    	return cb && cb(err);
    };


    if (script.readyState){  //IE
        script.onreadystatechange = function() {
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                return callback && callback(null);
            }
        };
    } else {  //Others
        script.onload = function(){
            return callback && callback(null);
        };

        script.onerror = function (err) {
        	return callback && callback('error');
        };
    }

    script.src = url;
    document.body.appendChild(script);
}



//加载自定义文件
function loadGFWDisqus() {
	var gfwDisqus = document.createElement("iframe");  
	gfwDisqus.src ="http://127.0.0.1:3000/comments";
	gfwDisqus.allowtransparency = "true";
	gfwDisqus.frameBorder = "0";
	gfwDisqus.width = "100%";
	gfwDisqus.height = "300px";  
	gfwDisqus.scrolling = "no";
	gfwDisqus.tabindex = "0";
	gfwDisqus.style ="width: 1px !important; min-width: 100% !important; border: none !important; overflow: hidden !important; height: 300px !important; background: red;"
	gfwDisqus.horizontalscrolling = "no";
	gfwDisqus.verticalscrolling = "no"

	document.getElementById("disqus_thread").appendChild(gfwDisqus); 
}


//加载原生文件
function loadDisqus() {
	(function() {
	    var d = document, s = d.createElement('script');
	    s.src = 'https://test-apkdzgmqhj.disqus.com/embed.js';
	    s.setAttribute('data-timestamp', +new Date());
	    (d.head || d.body).appendChild(s);
	})();
}


//测试加载文件
loadScript('https://test-apkdzgmqhj.disqus.com/embed.js', function(err) {
	//如果不正常，生产iframe框架
	if(err) {
		loadGFWDisqus();
	} else {
		loadDisqus();
	}
});



})(window);