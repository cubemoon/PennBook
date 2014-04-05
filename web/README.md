Web Frontend & Backend
===================================

This folder contains the web service frontend/backend for PennBook project implementation (team19). 

Deployment
-----------------------------------
The web service can be deployed on any NodeJs instance (it is originally developed to run on EC2).

To deploy the web service, first make sure that you have created a `config.json` with the fields of config.json.sample
filled out with your corresponding credentials.

Then you can run `npm install` to install the basic dependancies.

To start the server, run `node app`.

Database
-----------------------------------
You must set up a SimpleDB database prior to deployment. The "Schema" of the database is given 
in the main directory of the project under `web-db-design.md`. 

Then you may modify the dom sections in `config.js` so that they correspond to the names of the domains you
created in your SimpleDB service area.

Adapting Other Databases
-----------------------------------
It is also possible to adapt other distributed key-value databases as the backend database. Most of 
the database model is described in `models/mSimpleDB.js` and you may add new adapters for other database
types that you may wish to use. You can also hook a backing DB for session storage.

Running
------------------------------------
The project is designed to not throw critical exceptions if possible, however since this was a term project
you should expect some bugs to eventually come out with use. If you actaully use this in production, please 
note that there are quite a few nodejs tools to restart the web service if it crashes. Make good use of them.

(Just as a note, the server generally runs for weeks under mild usage without crashing, but depending on
what type of VPS/Instance you have, YMMV)


中文
====================================

配布
---------
服务器的配布非常简单，不过由于我们项目是学期间作业，所以我们只在亚马逊的EC2服务器上进行过深入的测试，不过理论上任何支持Nodejs的VPS都可以完美的支持本服务。

首先你需要架设好Node.js并上传相应的代码。之后你需要参照 `config.json.sample` 填入相亚马逊服务密钥关区域并保存为 `config.json`。

这些完成后你可以运行 `npm install` 来让node自动安装依赖的库。

这些操作进行完毕后，你就可以通过 `node app` 启动服务器咯～

数据库后端
---------
你必须在运行服务器之前事先在SimpleDB上手动建立好相应的数据库Domain。这些可以参考上层目录里的 web-db-design.md 文件。如果你没有使用默认的
命名，你可以在 `config.js` 里面更改数据库domain的命名方式。

非依赖亚马逊的后端
----------
理论上你可以使用任何键值存储（Key Value Store），不过由于是学期的项目所以没有仔细写过其他的Adapter。可以参考 `models/mSimpleDB.js` 实现
类似的API访问数据库。

运行
----------
我们尽量使得服务器变得稳定了，不过由于是学期项目，在一些极个别的情况下还是有些BUG会出现的。如果想在生产环境中配布，有很多Node工具可以自动在服务挂掉的
时候重启服务。请善用它们。
