var user = null;
var pageparser = require("../models/mRenderTools.js");
var db = null;

exports.init = function(userobj){
	user = userobj;
	db = require("../models/mSimpleDB.js");
	db.init(require("../config.js"));
}

exports.main = function(req,res){
	user.init(function(){
		// Check user info
		if(!user.loggedIn()){
			res.redirect("/login");
			return;
		}
		if(req.params.username == user.username()){
			res.render("timeline", {
				user: user.basicInfo(),
				ext: {
					basic: user.basicInfo(),
					aff: user.get("affiliation"),
					interests: user.get("interests").join(","),
					birthday: user.get("birthday").toDateString(),
					isFriend: true,
					friendType: "self"
				},
				page: pageparser.parse(req)
			});
		} else {
			db.getUser(req.params.username, function(resp){
				if(resp.code !== 200){
					res.render("404", {
						user: user.basicInfo()
					});
				}else {
					user.init(null, req);
					user.getFriends(function(fr, rel){
						user.init(null, req);
						if(rel)
							var friendType = rel[req.params.username];
						else
							var friendType = null;
						res.render("timeline", {
							user: user.basicInfo(),
							ext: {
								basic: user.basicInfo(resp.desc),
								aff: resp.desc["affiliation"],
								interests: resp.desc["interests"].join(","),
								birthday: resp.desc["birthday"].toDateString(),
								isFriend: !(fr.indexOf(req.params.username) < 0),
								friendType: friendType
							}
						});
					});
				}
			});
		}
	}, req);
};

exports.ajax = function(req, res){
	res.setHeader("Content-Type","application/json");
	user.init(function(){
		// Check user info
		if(!user.loggedIn()){
			res.redirect("/login");
			return;
		}
		if(req.body.nonce !== req.session.snonce){
			res.end(JSON.stringify({
				code:400,
				desc:"NONCE_ERROR"
			}));
			return;
		}
		if(!req.body.value || req.body.value.length <= 0 && req.params.setting !== "interests"){
			res.end(JSON.stringify({
				code:304,
				desc:"NO_VALUE_SPECIFIED"
			}));
			return;
		}
		req.session.snonce = db.salt(8);
		var baseResp = {
			nonce : req.session.snonce
		};
		var upobj = {};
		switch(req.params.setting){
			default:{
				res.end(JSON.stringify({
					code:400,
					desc:"UNRECOGNIZED_PROPERTY"
				}));
				return;
			}
			case "password":
				upobj[req.params.setting] = db.hash(req.body.value, db.salt(8));
				break;
			case "interests":
				upobj[req.params.setting] = req.body.value.split(",");
				break;
			case "fullname":
			case "affiliation":
			case "email":
			case "defaultPrivacy":
				upobj[req.params.setting] = req.body.value;
				break;
		}
		db.updateUser(user.username(), upobj, function(resp){
			if(resp.code === 200){
				baseResp.code = 200;
				baseResp.desc = "SUCCESS";
				req.session.user[req.params.setting] = upobj[req.params.setting];
				user.init(null, req);
				res.end(JSON.stringify(baseResp));
				return;
			}else{
				baseResp.code = 500;
				baseResp.desc = resp.desc;
				res.end(JSON.stringify(baseResp));
			}
		});
	}, req);
};

exports.settings = function(req, res){
	user.init(function(){
		if(!user.loggedIn()){
			res.redirect("/login");
			return;
		}
		if(!req.session.snonce)
			req.session.snonce = db.salt(8);
		res.render("settings", {
			user: user.basicInfo(),
			ext: {
				aff: user.get("affiliation"),
				interests: user.get("interests").join(", ")
			},
			nonce:req.session.snonce, 
			page: pageparser.parse(req)
		});
	}, req);
};

exports.search = function(req, res){
	user.init(function(){
		if(!req.query.s && req.query.s === ""){
			res.redirect("/");
			res.end();
			return;
		}
		db.query(db.canned.search(req.query.s), function(resp){
			if(resp.code !== 200){
				res.render("search", {
					user: user.basicInfo(),
					results: []
				});
			}else{
				var items = resp.desc;
				var results = [];
				for(var i = 0; i < items.length; i++){
					var newuser = {
						fullname : "",
						username : items[i].Name,
						avatar : "",
					};
					if(!items[i].Attributes)
						continue;
					for(var j = 0; j < items[i].Attributes.length; j++){
						switch(items[i].Attributes[j].Name){
							case "username":
								newuser.username = items[i].Attributes[j].Value;
								break;
							case "fullname":
								newuser.fullname = items[i].Attributes[j].Value;
								break;
							case "email":
								newuser.avatar = user.getAvatar({email:items[i].Attributes[j].Value});
								break;
							case "affiliation":
								newuser.aff = items[i].Attributes[j].Value;
								break;
							default:
								break;
						}
					}
					results.push(newuser);
				}
				res.render("search", {
					user: user.basicInfo(),
					results: results
				});
				return;
			}
		});
	}, req);
};
