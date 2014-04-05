var express = require('express');
var routes = require('./routes/routes.js');
var config = require('./config.js');
var app = express();

app.configure(function(){
	app.use('/', express.static(__dirname + "/public",{maxAge:86400000}));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.cookieParser());
	app.use(express.session({secret: 'VfdQAKct5X_Hj6PXJm7Nc6vTSWgVW3Pb'}));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.logger("default"));
	app.use(express.logger('dev'));
	app.use(app.router);
});

app.get('/', routes.main);
app.get('/login', routes.login);
app.post('/login', routes.auth);
app.get('/logout', routes.logout);
app.get('/register', routes.register);
app.get('/search', routes.user.search);
app.get('/user/settings', routes.user.settings);
app.get('/user/visualization', routes.visualizer);
app.get('/user/:username', routes.user.main);


/* Ajax and stuff */
app.post('/ajax/post/:type', routes.post.ajax);
app.post('/ajax/reply', routes.ajax.reply);
app.get('/ajax/reply/:postid', routes.ajax.getReplies);
app.post('/ajax/like', routes.post.like);

app.get('/ajax/newsfeed', routes.post.newsfeed);
app.get('/ajax/timeline/:username', routes.post.timeline);
app.get('/ajax/notifications', routes.ajax.notification);
app.get('/ajax/notifications/remove/:nid', routes.ajax.clearNotification);

app.get('/ajax/friends', routes.ajax.getfriends);
app.get('/ajax/online', routes.ajax.getonline);
app.get('/ajax/recommend', routes.ajax.getrecommend);
app.get('/ajax/search', routes.ajax.typeahead);
app.post('/ajax/register', routes.ajax.register);
app.post('/ajax/register/check', routes.ajax.checkregister);

app.post('/ajax/friend/:oper', routes.ajax.friend);
app.post('/ajax/settings/:setting', routes.user.ajax);

app.get("*", routes.fourohfour);
/* Run the server */

console.log('Team 19: Quanze Chen, Chenyang Lei');
app.listen(8080).on('error', function(){
	console.log("[Err] Express server init failed. Port in use?");
});;
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
