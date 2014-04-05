var user = require("../models/mUser.js");
var pageparser = require("../models/mRenderTools.js");

exports.user = require("./users.js");
exports.user.init(user);

exports.post = require("./post.js");
exports.post.init(user);

exports.ajax = require("./ajax.js");
exports.ajax.init(user);

exports.main = function(req, res){
	user.init(function(){
		if(!user.loggedIn()){
			res.redirect("/login");
			return;
		}
		res.render("index", {
			user: user.basicInfo(),
			page: pageparser.parse(req)
		});
	}, req);
};

exports.login = function(req, res){
	user.init(function(){
		if(user.loggedIn()){
			// Dont need to login again!
			res.redirect("/");
			return;
		}
		if(!req.session.nonce){
			req.session.nonce = pageparser.nonce()
		}
		res.render("login", {
			page: pageparser.parse(req),
			msgid: req.query.error,
			nonce:req.session.nonce
		});
	}, req);
};

exports.auth = function(req, res){
	// Authenticates the login itself
	user.init(function(){
		if(user.loggedIn()){
			res.redirect("/");
			return;
		}
		if(!req.body.nonce){
			res.redirect("/login?error=3"); // nonce failed
			return;
		}
		if(!req.body.username || !req.body.password){
			res.redirect("/login?error=1"); // field not entered
			return;
		}
		req.session.nonce = pageparser.nonce();
		user.auth(req.body.username, req.body.password, function(uobj){
			if(uobj){
				req.session.user = uobj;
				req.session.save();
				res.redirect("/");
				return;
			}else{
				res.redirect("/login?error=2"); // wrong password
				return;
			}
		});
	}, req);
};

exports.logout = function(req, res){
	user.destroy();
	req.session.user = null;
	delete req.session.user;
	req.session.save();
	res.redirect("/login");
};


exports.register = function(req, res){
	user.init(function(){
		res.render("register", {
			page: pageparser.parse(req)
		});
	}, req);
};

exports.visualizer = function(req, res){
	user.init(function(){
		if(!user.loggedIn()){
			res.redirect("/login");
			res.end();
			return;
		} else {
			res.render("visualize", {
				user: user.basicInfo()
			});
			return;
		}
	}, req);
};

exports.fourohfour = function(req, res){
	user.init(function(){
		if(user.loggedIn()){
			res.render("404", {
				user: user.basicInfo()
			});
		}else{
			res.render("404-bare");
		}
	}, req);
}
