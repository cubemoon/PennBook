var user = null;
var db = require("../models/mSimpleDB.js");

function shuffle(o){
	// ADAPTED FROM STACKOVERFLOW
	for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

exports.init = function(udata){
	user = udata;
};

exports.ajax = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
		}
		var pobject = {
			text : req.body.content,
			privacy : req.body.privacy,
			type : req.params.type,
			author : user.username(),
			pic : user.getAvatar(),
			replies: 0,
			likes: 0,
			time: (new Date()),
		};
		if(req.body.target && req.params.type === "wall"){
			pobject["target"] = req.body.target;
		}
		db.createPost(pobject, function(data){
			if(data.code === 200){
				if(req.params.type === "wall" && req.body.target !== user.username()){
					//Posting on someone else's wall
					//Send a notification!
					db.addNotification({
						"text": user.get("fullname") + " posted on your wall!",
						"url":"/user/" + req.body.target
					}, req.body.target, function(respo){
						console.log(respo.code + " : WALL " +req.body.target);
					});
				}
				res.end(JSON.stringify({
					code:200,
					desc:"SUCCESS"
				}));
			}else{
				console.log(data);
				res.end(JSON.stringify(data));
			}
		});
	}, req);
};

exports.newsfeed = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		user.getFriends(function(fr){
			user.init(null, req);
			if(fr.length === 0){
				fr.push(user.username());
			}
			// Shuffle friends
			fr = shuffle(fr);
			fr.slice(0, 10);
			db.newsfeed(user.username(), fr, function(resp){
				user.init(null, req);
				if(resp.code === 200){
					resp.username = user.username();
					res.end(JSON.stringify(resp));
				}else{
					console.log(resp);
					res.end(JSON.stringify(resp));
				}
			}); 
		});
	}, req);
};

exports.like = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
		}
		db.like(req.body.index, user.username(), function(resp){
			if(resp.code === 200){
				res.end(JSON.stringify(resp));
			}else{
				console.log(resp);
				res.end(JSON.stringify(resp));
			}
		}); 
	}, req);
};

exports.timeline = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
		}
		if(!req.params.username || req.params.username === ""){
			res.end(JSON.stringify({
				code:400,
				desc:"BAD_USERNAME"
			}));
		}
		db.timeline(req.params.username, function(resp){
			user.init(null, req);
			if(resp.code === 200){
				resp.username = user.username();
				res.end(JSON.stringify(resp));
			}else{
				console.log(resp);
				res.end(JSON.stringify(resp));
			}
		}); 
	}, req);
};
