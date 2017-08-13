;(function( window ){
  'use strict';

function loadJS(url) {
    var d = document, s = d.createElement('script');
    s.src = url;
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
}

var isIE = function(ver){
    var b = document.createElement('b')
    b.innerHTML = '<!--[if IE ' + ver + ']><i></i><![endif]-->'
    return b.getElementsByTagName('i').length === 1
}


var isSupper = (!!window.addEventListener) && (!isIE());
if(isSupper) {

    if(!window.gfw_disqus_config) {
        window.gfw_disqus_config = {};
    }


    if(!window.gfw_disqus_config.url) {
        if (!window.location.origin) {
            window.gfw_disqus_config.url = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
        } else {
            window.gfw_disqus_config.url = window.location.origin;
        }        
    }

    //加载js
    loadJS(window.gfw_disqus_config.url + '/graphics.min.js');
    loadJS(window.gfw_disqus_config.url + '/reqwest.min.js');

    window.onload=function(){
       loadJS(window.gfw_disqus_config.url + '/gfw-disqus.js');
    }    
} else {
    (function() {
        var d = document, s = d.createElement('script');
        s.src = 'https://wangzhechao.disqus.com/embed.js';
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();
}

})(window);