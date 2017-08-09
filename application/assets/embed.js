;(function( window ){
  'use strict';

// function loadScript(url, cb) {
// 	var callback, handle;
//     var script = document.createElement("script");
//     script.type = "text/javascript";


//     //设置超时时间
//     handle = setTimeout(function() {
//     	return callback && callback('timeout');
//     }, 3000);


// 	//回调
//     callback = function(err) {
//     	clearTimeout(handle);
//     	callback = handle = null;
//     	return cb && cb(err);
//     };


//     if (script.readyState){  //IE
//         script.onreadystatechange = function() {
//             if (script.readyState == "loaded" ||
//                     script.readyState == "complete"){
//                 script.onreadystatechange = null;
//                 return callback && callback(null);
//             }
//         };
//     } else {  //Others
//         script.onload = function(){
//             return callback && callback(null);
//         };

//         script.onerror = function (err) {
//         	return callback && callback('error');
//         };
//     }

//     script.src = url;
//     document.body.appendChild(script);
// }



// //加载自定义文件
// function loadGFWDisqus() {

//     window.addEventListener('message', function(event){
//         console.log(event);
//     }, false);


// 	var gfwDisqus = document.createElement("iframe");  
// 	gfwDisqus.src ="http://127.0.0.1:3000/comments";
// 	gfwDisqus.allowtransparency = "true";
// 	gfwDisqus.frameBorder = "0";
// 	gfwDisqus.width = "100%";
// 	gfwDisqus.scrolling = "no";
// 	gfwDisqus.tabindex = "0";
// 	gfwDisqus.style ="width: 1px !important; min-width: 100% !important; border: none !important; overflow: hidden !important;  background: red;"
// 	gfwDisqus.horizontalscrolling = "no";
// 	gfwDisqus.verticalscrolling = "no"

// 	document.getElementById("disqus_thread").appendChild(gfwDisqus);
// }


// //加载原生文件
// function loadDisqus() {
// 	(function() {
// 	    var d = document, s = d.createElement('script');
// 	    s.src = 'https://wangzhechao.disqus.com/embed.js';
// 	    s.setAttribute('data-timestamp', +new Date());
// 	    (d.head || d.body).appendChild(s);
// 	})();
// }

// loadGFWDisqus();


//测试加载文件
// loadScript('https://wangzhechao.disqus.com/embed.js', function(err) {
// 	//如果不正常，生产iframe框架
// 	if(err) {
// 		loadGFWDisqus();
// 	}
// });
function loadJS(url) {
    var d = document, s = d.createElement('script');
    s.src = url;
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
}

if(disqus_config)
    disqus_config = {};

disqus_config.url = 'http://127.0.0.1:3000';

//加载js
loadJS(disqus_config.url + '/graphics.min.js');
loadJS(disqus_config.url + '/reqwest.js');

window.onload=function(){
   loadJS(disqus_config.url + '/gfw-disqus.js');
}


})(window);