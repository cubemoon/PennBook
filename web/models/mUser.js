var data = {
	"username":"",
	"email":"",
	"fullname":"",
	"password" : "",
	"birthday" : new Date(),
	"interests": [],
	"profilePic": null,
	"affiliation": "",
	"defaultPrivacy": "public",
	"lastLogin": new Date(),
};
var db = require("./mSimpleDB.js"), idgen = require("./mIDGen.js"), crypto = require("crypto");

db.init(require("../config.js"));

var isInit = false;
var avatar = null;
var friends = null;
var reqref = null;

exports.init = function(callback, req){
	if(req.session.user && req.session.user.username && req.session.user.password){
		// Just copy the data over
		data = req.session.user;
		data.birthday = req.session.user.birthday ? new Date(req.session.user.birthday) : new Date();
		data.lastLogin = req.session.user.lastLogin ? new Date(req.session.user.lastLogin) : new Date();
		isInit = true;
	}else{
		isInit = false;
	}
	if(callback)
		callback(this);
};

exports.auth = function(username, password, callback){
	db.auth(username, password, function(resp){
		if(resp.code === 200){
			callback(resp.desc);
		}else{
			callback(null);
		}
	});
};

exports.username = function(){
	return data["username"];
};

exports.getAvatar = function(d){
	var mdsum = crypto.createHash("md5");
	mdsum.update(d ? d["email"] : data["email"]);
	var navatar = "http://www.gravatar.com/avatar/" + mdsum.digest("hex");
	return navatar;
};

exports.getFriends = function(callback, username){
	db.getFriends(username ? username : exports.username(), function(resp){
		if(resp.code !== 200){
			callback([], {});
		}else{
			callback(resp.desc, resp.rel);
		}
	});
};

exports.getProfilePic = function(){
	if(data["profilePic"])
		return data["profilePic"].replace(/^javascript/, "");
	return "/cover.jpg";
};

exports.destroy = function(){
	data = {};
	isInit = false;
};

exports.get = function(key, def){
	if(!isInit)
		return null;
	return data[key] ? data[key] : def;
};

exports.loggedIn = function(){
	return isInit;
};

exports.basicInfo = function(d){
	if(!d){
		d = data;	
	}
	return {
		uname: d.username,
		fname: d.fullname,
		email: d.email,
		avatar: exports.getAvatar(d),
		login: exports.loggedIn()
	};
};
