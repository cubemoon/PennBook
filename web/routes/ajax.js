var user = null;
var db = require("../models/mSimpleDB.js"), config = require("../config.js");

db.init(config);

function filterNum(text){
	return (text + "").replace(/[^0-9]/g, "");
};
exports.init = function(udata){
	user = udata;
};

exports.friend = function(req, res){
	// Process friending someone
	res.setHeader("Content-Type", "application/json");
	if(!req.params.oper || !req.body.target || req.body.target === ""
		|| (req.params.oper !== "add" && req.params.oper !== "remove")){
		res.end(JSON.stringify({
			code:401,
			desc:"OPERATION_NOT_RECOGNIZED"
		}));
		return;
	}
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		if(req.params.oper === "add"){
			db.addFriend(user.username(), req.body.target, function(resp){
				user.init(null, req);
				if(resp.code === 200){
					// Send a notification to the other
					if(req.body.mode === "approve"){
						var msg = user.get("fullname") + " approved your friend request.";
					}else{
						var msg = user.get("fullname") + " sent you a friend request.";
					}
					db.addNotification({
						text:msg,
						url:"/user/" + user.username()
					}, req.body.target, function(resp){
						user.init(null, req);
						// This is optional actually
						console.log(resp.code + " : ADD_FRIEND " + user.username() + " => " + req.body.target); 
					});
				}
				res.end(JSON.stringify(resp));
				return;
			});
			return;
		}else if(req.params.oper === "remove"){
			db.removeFriend(user.username(), req.body.target, function(resp){
				user.init(null, req);
				res.end(JSON.stringify(resp));
				return;
			});
		}else{
			res.end(JSON.stringify({
				code:404,
				desc:"OPER_NOT_FOUND"
			}));
		}
	}, req);
};

exports.notification = function(req, res){
	res.setHeader("Content-Type","application/json");
	// Get notification
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		db.updateLogin(user.username());
		db.query(db.canned.notification(user.username(), filterNum(req.query.q)), function(resp){
			user.init(null, req);
			console.log(resp);
			console.log(filterNum(req.query.q));
			if(resp.code === 200){
				
				var notes = [];
				var maxtime = "";
				for(var i = 0; i < resp.desc.length; i++){
					if(!resp.desc[i].Attributes || resp.desc[i].Attributes.length === 0)
						continue;
					var tmp = {};
					for(var j = 0; j < resp.desc[i].Attributes.length; j++){
						tmp[resp.desc[i].Attributes[j].Name] = resp.desc[i].Attributes[j].Value;
					}
					if(tmp["time"] && tmp["time"] > maxtime){
						maxtime = tmp["time"];
					}
					try{
						var n = JSON.parse(tmp["notification"]);
						n.hash = db.hash(JSON.stringify(tmp));
						n.id = resp.desc[i].Name;
						notes.push(n);
					}catch(e){
						console.log(tmp);
					}
				}
				res.end(JSON.stringify({
					code:200,
					desc:"SUCCESS",
					token: maxtime,
					data:notes,
					username: user.username()
				}));
				
			}else if(resp.code === 404){
				res.end(JSON.stringify({
					code:200,
					desc:"SUCCESS",
					token: req.query.q,
					data:[],
					username: user.username()
				}));
				return;
			}else{
				res.end(JSON.stringify({
					code:500,
					desc:"FAIL_BAD_REPLY",
					username: user.username()
				}));
			}
		});
	}, req);
};

exports.clearNotification = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		if(!req.params.nid){
			res.end(JSON.stringify({
				code:400,
				desc:"ID_ERROR"
			}));
			return;
		}
		db.removeNotification(req.params.nid, user.username(), function(resp){
			// We dont really care here
			res.end(JSON.stringify({
				code:200,
				desc:"SUCCESS",
				refr:resp
			}));
			return;
		});
	}, req);
};

exports.reply = function(req, res){
	var trim = function(text){
		text = text.replace(/^Reply\sto\s\w+:/, "");
		if(text.length > 30)
			return text.substring(0, 30) + "...";
		return text;
	};
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		
		// Add a reply to the replydb
		db.addReply({
			"parent": req.body.postid,
			"author": user.username(),
			"text": req.body.text,
			"avatar": user.getAvatar()
		}, function(resp){
			user.init(null, req);
			if(resp.code === 200){
				if(req.body.target && req.body.target !== ""){
					db.addNotification({
						text:user.get("fullname") + " replied to you \"" + trim(req.body.text) + "\".",
						url: "/"
					}, req.body.target, function(resp){
						console.log("Reply-Notify " + req.body.target);
					});
				}
			}
			res.end(JSON.stringify(resp));
		});
	}, req);
};

exports.getReplies = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		
		// Get replies from the reply db
		db.getReplies(req.params.postid, filterNum(req.query.token), function(resp){
			if(resp.token == null && filterNum(req.query.token) != null)
				resp.token = filterNum(req.query.token);
			res.end(JSON.stringify(resp));
		});
	}, req);
};

exports.getfriends = function(req,res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		var uname = req.query.user ? req.query.user : user.username();
		db.getFriends(uname, function(resp){
			res.end(JSON.stringify({
				code:resp.code,
				uname: uname,
				desc:resp.desc
			}));
		});
	}, req);
};

exports.register = function(req, res){
	res.setHeader("Content-Type","application/json");
	if(!req.body.username || !req.body.fullname || !req.body.email || 
		req.body.username.length == 0 || req.body.fullname.length == 0 || 
		req.body.email.length == 0){
		
		res.end(JSON.stringify({
			code:403,
			desc:"REQUIRED_FIELDS_EMPTY"
		}));
		return;
	}
	if(!req.body.password || req.body.password.length < 8){
		res.end(JSON.stringify({
			code:403,
			desc:"PASSWORD_TOO_SHORT"
		}));
		return;
	}
	db.createUser({
		username : req.body.username,
		fullname : req.body.fullname,
		email : req.body.email,
		password : db.hash(req.body.password, db.salt(8)),
		defaultPrivacy : "public",
		affiliation: req.body.affiliation,
		interests : req.body.interests.split(","),
		birthday : new Date(req.body.birthday),
		lastLogin : new Date()
	}, function(resp){
		res.end(JSON.stringify(resp));
	});
};

exports.getrecommend = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		db.getRecommend(user.username(), function(resp){
			if(resp.code !== 200){
				res.end(JSON.stringify(resp));
				return;
			}else{
				if(resp.list)
					for(var x in resp.list){
						resp.list[x].avatar = user.getAvatar(resp.list[x]);
					}
				res.end(JSON.stringify(resp));
				return;
			}
		});
	},req);
};

exports.getonline = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		if(!user.loggedIn()){
			res.end(JSON.stringify({
				code:403,
				desc:"NOT_LOGGED_IN"
			}));
			return;
		}
		user.getFriends(function(friends){
			user.init(null, req);
			var check = {};
			for(var i = 0;  i < friends.length; i++){
				check[friends[i]] = null;
			}
			console.log(check);
			db.queryUsers(check,function(resp){
				user.init(null, req);
				if(resp.code === 200){
					var online = [];
					for(var x in resp.desc){
						var item = resp.desc[x];
						if(Math.abs((new Date()).getTime() - item.lastLogin.getTime()) < 10000){
							online.push({
								username: item.username,
								fullname: item.fullname,
								avatar: user.getAvatar(item)
							});
						}
					}
					res.end(JSON.stringify({
						code:200,
						desc:online
					}));
				}else{
					res.end(JSON.stringify(resp));
					return;
				}
			});
		});
	}, req);
};

exports.checkregister = function(req, res){
	res.setHeader("Content-Type","application/json");
	res.end(JSON.stringify({
		code:200,
		desc:"AVAILABLE"
	}));
};

exports.typeahead = function(req, res){
	res.setHeader("Content-Type","application/json");
	db.query(db.canned.typeahead(req.query.q), function(resp){
		if(resp.code === 404){
			res.end(JSON.stringify({
				code:200,
				desc:[]
			}));
			return;
		}else if(resp.code === 200){
			var names = [];
			for(var i = 0; i < resp.desc.length; i++){
				for(var j = 0; j < resp.desc[i].Attributes.length; j++){
					if(resp.desc[i].Attributes[j] && 
						resp.desc[i].Attributes[j].Name == "fullname"){
						names.push(resp.desc[i].Attributes[j].Value);
					}
				}
			}
			res.end(JSON.stringify({
				code:200,
				desc:names
			}));
			return;
		}else{
			res.end(JSON.stringify({
				code:resp.code,
				desc:resp.desc
			}));
			return;
		}
	});
};
