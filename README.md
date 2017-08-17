# gfw-disqus
ghost博客使用的评论框，主要封装代理disqus的API。

## 1. 运行环境

程序后端使用nodejs搭建，如果非ghost博客系统需要另行安装nodejs。部署服务器需要可以访问disqus官网，并且需要提供公网IP，推荐绑定单独的二级域名，如：

```
http://disqus.wangzhechao.com
```

## 2. 安装方法

将程序安装包上传到服务器，在程序解压目录下，运行npm安装依赖：

```
npm install
```

启动程序：

```
node index.js
```

如果长久运行，推荐和pm2配合使用。

## 3. 演示程序

当前功能支持发表和展示评论（推荐有能力重写前端）

演示地址：http://disqus.wangzhechao.com

## 4. 部署设置

部署该程序，需要设置三个地方，分别是disqus官网设置、前端加载设置以及后端程序设置。

###4.1 Disqus设置



###4.2  前端设置



### 4.3 后端设置



##5. 后端接口说明