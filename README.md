PennBook Scalable SNS
==========================================
PennBook (T19) is an implementation of a scalable social networking site for the
NETS 212 course. It is designed to be a simple, feature-complete SNS site that 
can be easily scaled up.

For this project we use Amazon's SimpleDB as a backing Key-Value store and we 
use NodeJS(+Express) as the web interface backend / frontend.

This implementation supports:

- User postings (statuses), User Wall posts, shares and images (to be 
implemented)
- "Reply" support for any type of post and Likes support (with extensibility for 
    unlikes etc.)
- News feed with quick eventual consistency
- User notifcation support (including notifications for replies)
- User walls/timeline
- Friend Requests
- Network visualization (As part of assignment)
- Multiple safeguards against XSRF and XSS exploits
- Privacy controls for posts

We also have implemented a MapReduce task that will give friend recommendations 
using the adsorption algorithm.

Deployment
----------------------
For deployment of the web backend please read [README](web/README.md) in the web
directory. The MapReduce task is run manually (although automation support is 
provided for database exporting/recommendation importing which allows you to 
hack support for it as as cron job).

Reliability & Extensibility
----------------------
This implementation is intended to be a base for future development so we try
to take care of most basic features such as security and reliability as well as 
we can (though please keep in mind this is a term assignment).

In production wise tests the web service has stable behavior and can handle mild 
userloads with ease.

There is much you can extend with the current implementation, so dig in!

Licensing
--------------------
This project is licensed under the NETS212 License (Modified MIT License). The 
only extra condition is that this project may not be used as a base for any 
course project unless explicitly approved by the course instructor.

Screenshot
---------------------
![Screenshot](http://www.cis.upenn.edu/~nets212/img/g19-1.png)

中文
====================
PennBook (T19) 是一个可扩展的（Scalable）社交网络平台的实现。它是作为 NETS 212 课程结束项目
编写的。这个项目设计为实现简单而全面的的社交功能（类似脸谱网），同时可以轻松的实现规模扩增。

我们支持如下功能：

- 用户状态，分享和图片（包括往个人墙上PO）
- 对于状态，分享和图片的评论
- 新鲜事实现，并且包含快速结果整合性（Eventual Consistency）的保障
- 支持用户提醒，包括回复体性
- 支持用户“时间轴”和个人信息“墙”
- 支持完整的好友请求
- 支持网络的图形化演示（因为项目需求）
- 多重保障避免XSRF和XSS攻击
- 状态的发布的信息的隐私设置

同时我们还有一个通过 MapReduce 实现的分析任务，可以手动运算来实现进行好友的推荐。

配布
------
请参考web文件夹里面的[README](web/README.md)。注意好友推荐不是自动化的，不过有脚本帮助导入导
出，所以可以通过一些手段架设成 cron 任务。

稳定性和可扩展性
------
我们尽可能把项目做的稳定和安全，因为这是一个项目的要求。不过当你在决定配布到生产环境下时，请不要忘记
这只是一个学期的项目，所以我们的测试并不非常充足。当然在有限的设置里面，我们的项目达到了比较高的稳定
程度，并且可以轻松的驾驭中等的用户量。

许可
------
许可协议改自MIT许可，区别是我们有一条附加条款，不允许本项目用于课程作业的一部分，除非如果教师特殊允许
这个行为。
