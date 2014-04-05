var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var simpledb = new AWS.SimpleDB();
var crypto = require("crypto");
var idgen = require("./mIDGen.js");
var config = null;

// Canned select statement builder
exports.canned = {
	timeline : function(user, limit){
		return "SELECT * FROM " + config.db.dom.posts + " WHERE ((author = \"" + user + "\" AND type != \"wall\") OR target = \"" + user + "\") AND privacy = 'public' AND time IS NOT null ORDER BY time DESC" + (limit ? " LIMIT " + limit : "");
	},
	replies: function(pid, token){
		return "SELECT * FROM " + config.db.dom.replies + " WHERE `parent` = \"" + pid + "\" AND time " + (token ? " > '" + token + "'": "IS NOT null") + " ORDER BY time DESC LIMIT 200";
	},
	newsfeed : function(user, friends, limit){
		var friendsR = [];
		for(var i = 0; i < friends.length; i++){
			friendsR.push("'" + friends[i] + "'");
		}
		var q = "SELECT * FROM " + config.db.dom.posts + " WHERE (author IN (" + friendsR.join(",") + ") AND privacy IN ('public','friends') OR author = \"" + user + "\" OR target = \"" + user + "\") AND time IS NOT null ORDER BY time DESC" + (limit ? " LIMIT " + limit : "");
		console.log(q);
		return q;
	},
	postsTime : function(time, limit){
		return "SELECT * FROM " + config.db.dom.posts + " WHERE time > \"" + time.toISOString() + "\"" + (limit ? " LIMIT " + limit : "");
	},
	friendship : function(user1, user2){
		return "SELECT * FROM " + config.db.dom.friends + " WHERE itemName() IN (\"" + user1 + ":" + user2 + "\", \"" + user2 +  ":" + user1 +"\")";
	},
	friends : function(user){
		return "SELECT * FROM " + config.db.dom.friends + " WHERE `from` = \"" + user + "\" OR `to` = \"" + user + "\"";
	},
	recommendations: function(user){
		return "SELECT * FROM " + config.db.dom.recommend + " WHERE `to` = \"" + user + "\" AND `order` IS NOT null ORDER BY `order` DESC LIMIT 20";
	},
	notification : function(user, token){
		return "SELECT * FROM " + config.db.dom.notification + " WHERE owner = \"" + user + "\"" + (token ? " AND time > \"" + token + "\"" : " AND time IS NOT null") + " ORDER BY time ASC";
	},
	typeahead: function (typed){
		return "SELECT fullname FROM " + config.db.dom.users + " WHERE fullname LIKE \'" + typed + "%\' LIMIT 15";
	},
	search: function(querykey){
		return "SELECT * FROM " + config.db.dom.users + " WHERE fullname LIKE \'%" + querykey+ "%\' LIMIT 100";
	}
};

exports.init = function(conf){
	config = conf;
}

var getSalt = function(password){
	var pw = password.split("$");
	if(pw.length > 1){
		return pw[1];
	}else{
		return null;
	}
}

exports.hash = function(text, salt){
	// Hash for password
	var shasum = crypto.createHash('sha1');
	if(salt != null){
		shasum.update(text + ",SALT=" + salt);
		return shasum.digest('hex') + "$" + salt;
	}else{
		shasum.update(text);
		return shasum.digest('hex');
	}
}

exports.salt = function(len, set){
	var text = "";
    var charset = set ? set : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
};

exports.zeroPad = function(number, len){
	// Zero pad a number
	var nt = "" + number;
	if(nt.length >= len)
		return nt;
	else{
		while(nt.length < len){
			nt = "0" + nt;
		}
		return nt;
	}
};

exports.unPad = function(number){
	var number = number.replace(/^0+/g, "");
	var n = parseInt(number);
	if(isNaN(n)){
		return 0;
	}else{
		return n;
	}
};

/******************************************************************************
************************** END OF HELPER FUNCTIONS ****************************
*******************************************************************************/

exports.createUser = function(user, callback){
	simpledb.getAttributes({
		DomainName:config.db.dom.users, 
		ItemName: user.username, 
		ConsistentRead: true
		}, function (err, data){
		
		if(err) {
			callback({
				code:500,
				desc:err
			});
			return;
		} else if (data && data.Attributes != null){
			callback({
				code:409,
				desc:"ACCOUNT_CONFLICT"
			});
			return;
		} else {
			// ADD
			var attribs = [];
			for(var x in user){
				switch(x){
					case "profilePic":
					case "fullname":
					case "affiliation":
					case "email":
					case "password":
					case "defaultPrivacy":
						attribs.push({Name: x, Value: user[x]});
						break;
					case "interests":
						attribs.push({Name: x, Value: JSON.stringify(user[x]) });
						break;
					case "birthday":
					case "lastLogin":
						attribs.push({Name: x, Value: user[x].toISOString() });
						break;
					default:
						break;
				}
			}
			//Check the attribs length
			if(attribs.length < 8){
				callback({
					code: 400,
					desc: "MISSING_FIELDS"
				});
				return;
			}
			simpledb.putAttributes({
				DomainName:config.db.dom.users, 
				ItemName:user.username, 
				Attributes: attribs
				}, function(err, data) {
				
				if (err) {
					console.log("[Err] Cannot create user : "+err);
					callback({
						code:500,
						desc:err
					});
					return;
				} else { 
					console.log("[Log] Create User (" + user.username + ")");
					callback({
						code:200,
						desc:"USER_CREATED",
						data: data
					});
					return;
				}
			});
		}
	});
};

exports.updateUser = function(username, fields, callback){
	simpledb.getAttributes({
		DomainName:config.db.dom.users, 
		ItemName: username, 
		ConsistentRead: true
		}, function (err, data){
		
		if(err) {
			callback({
				code:500,
				desc:err
			});
			return;
		} else if (!data || !data.Attributes){
			callback({
				code:404,
				desc:"NONEXISTANT_USER"
			});
			return;
		} else {
			var attribs = [];
			for(var x in fields){
				switch(x){
					case "profilePic":
					case "fullname":
					case "affiliation":
					case "email":
					case "password":
					case "defaultPrivacy":
						attribs.push({Name: x, Value: fields[x], Replace: true});
						break;
					case "interests":
						attribs.push({Name: x, Value: JSON.stringify(fields[x]), Replace: true });
						break;
					case "birthday":
					case "lastLogin":
						attribs.push({Name: x, Value: fields[x].toISOString(), Replace: true});
						break;
					default:
						break;
				}
			}
			simpledb.putAttributes({
				DomainName:config.db.dom.users, 
				ItemName:username, 
				Attributes: attribs
				}, function(err, data) {
					
				if (err) {
					console.log("[Err] Cannot update user : "+err);
					callback({
						code:500,
						desc:err
					});
					return;
				} else { 
					console.log("[Log] Update User (" + username + ")");
					callback({
						code:200,
						desc:"UPDATE_SUCCESS",
						data: data
					});
					return;
				}
			});
		}
	});
};

exports.createPost = function(postinfo, callback){
	var postid = idgen.idPost(postinfo, idgen.salt(32));
	simpledb.getAttributes({
		DomainName:config.db.dom.posts, 
		ItemName: postid,
		ConsistentRead: true
		}, function (err, data){
		
		if(err) {
			callback({
				code:500,
				desc:err
			});
			return;
		} else if (data.Attributes != null){
			// We have a collision? WTF
			exports.createPost(postinfo, callback);
			return;
		} else {
			var attribs = [];
			for(var x in postinfo){
				switch(x){
					case "type":
					case "text":
					case "author":
					case "pic":
					case "privacy":
					case "target":
						attribs.push({Name: x, Value: postinfo[x]});
						break;
					case "replies":
					case "likes":
						attribs.push({Name: x, Value: exports.zeroPad(postinfo[x], 64)});
						break;
					case "time":
						attribs.push({Name: x, Value: postinfo[x].toISOString()});
					default:
						break;
				}
			}
			//Check the attribs length
			if(attribs.length < 8){
				callback({
					code: 400,
					desc: "MISSING_FIELDS"
				});
				return;
			}
			simpledb.putAttributes({
				DomainName:config.db.dom.posts, 
				ItemName:postid, 
				Attributes: attribs
				}, function(err, data) {
				
				if (err) {
					console.log("[Err] Cannot post post : "+err);
					callback({
						code:500,
						desc:err
					});
					return;
				} else { 
					console.log("[Log] Create Post (author=" + postinfo.author + ")");
					callback({
						code:200,
						desc:"SUCCESS",
						data: data
					});
					return;
				}
			});
		}
	});
};

exports.updateLogin = function(username, callback){
	//Callback is optional
	if(!callback)
		callback = function(){};
	simpledb.getAttributes({
		DomainName:config.db.dom.users, 
		ItemName: username,
		ConsistentRead: true
		}, function (err, data){
		
		if(err) {
			callback({
				code:500,
				desc:err
			});
			return;
		} else if (!data.Attributes || data.Attributes == null){
			callback({
				code:404,
				desc:"NOT_FOUND"
			});
		} else {
			simpledb.putAttributes({
				DomainName:config.db.dom.users, 
				ItemName: username,
				Attributes: [{Name: "lastLogin", Value: (new Date()).toISOString() , Replace: true}]
			}, function(err,data){
				if(err){
					console.log("[Err] Cannot update : "+err);
					callback({
						code:500,
						desc:err
					});
					return;
				}else{
					callback({
						code:200,
						desc:"SUCCESS"
					});
					return;
				}
			});
		}
	});
}

exports.updatePost = function(postid, transform, callback){
	simpledb.getAttributes({
		DomainName:config.db.dom.posts, 
		ItemName: postid,
		ConsistentRead: true
		}, function (err, data){
		
		if(err) {
			callback({
				code:500,
				desc:err
			});
			return;
		} else if (!data.Attributes || data.Attributes == null){
			callback({
				code:404,
				desc:"NOT_FOUND"
			});
		} else {
			var fields = [];
			for(var i = 0; i < data.Attributes.length; i++){
				var t = transform(data.Attributes[i].Name, data.Attributes[i].Value);
				if(t){
					fields.push({Name: t.Name, Value: t.Value, Replace: true});
				}
			}
			if(fields.length === 0){
				callback({
					code:200,
					desc:"NOOP"
				});
				return;
			}
			simpledb.putAttributes({
				DomainName:config.db.dom.posts, 
				ItemName:postid, 
				Attributes: fields
			}, function(err,data){
				if(err){
					console.log("[Err] Cannot modify " + err);
					callback({
						code:500,
						desc:err
					});
					return;
				}else{
					callback({
						code:200,
						desc:"SUCCESS"
					});
					return;
				}
			});
		}
	});
};

exports.unlike = function(id, username, callback){
	
};

exports.like = function(id, username, callback){
	exports.updatePost(id, function(key, value){
		if(key === "likes")
			return {Name:"likes", Value: exports.zeroPad(exports.unPad(value) + 1,64)};
		else
			return null;
	}, function(resp){
		if(resp.code !== 200){
			callback(resp);
			return;
		}else{
			// Update success
			// TODO: add it into the likes db
			callback(resp);
		}
	});
};

/************** QUERIES ****************************/
var attribsToPost = function(itm, post){
	for(var j = 0; j < itm.Attributes.length; j++){
		switch(itm.Attributes[j].Name){
			case "type":
			case "text":
			case "author":
			case "pic":
			case "privacy":
			case "target":
			case "time":
				post[itm.Attributes[j].Name] = itm.Attributes[j].Value;
				break;
			case "replies":
			case "likes":
				post[itm.Attributes[j].Name] = exports.unPad(itm.Attributes[j].Value);
				break;
			default:
				break;
		}
	}
	return post;
};

exports.newsfeed = function(user, friends, callback){
	exports.query(exports.canned.newsfeed(user, friends, 30), function(resp){
		if(resp.code === 200){
			var posts = [];
			// We have items
			for(var i = 0; i < resp.desc.length; i++){
				var post = {
					hash : resp.desc[i].Name
				};
				var itm = resp.desc[i];
				if(itm.Attributes){
					post = attribsToPost(itm, post);
				}
				posts.push(post);
			}
			callback({
				code:200,
				desc: posts
			});
			return;
		}else if (resp.code === 404){
			callback({
				code:200,
				desc:[],
			});
			return;
		}else{
			callback({
				code:500,
				desc:resp.desc
			});
			return;
		}
	});
};

exports.timeline = function(user, callback){
	exports.query(exports.canned.timeline(user), function(resp){
		if(resp.code === 200){
			var posts = [];
			// We have items
			for(var i = 0; i < resp.desc.length; i++){
				var post = {
					hash : resp.desc[i].Name
				};
				var itm = resp.desc[i];
				if(itm.Attributes){
					post = attribsToPost(itm, post);
				}
				posts.push(post);
			}
			callback({
				code:200,
				desc: posts
			});
			return;
		}else if (resp.code === 404){
			callback({
				code:200,
				desc:[],
			});
			return;
		}else{
			callback({
				code:500,
				desc:resp.desc
			});
			return;
		}
	});
};



exports.addReply = function(reply, callback){
	if(!reply || !reply.parent || !reply.author || !reply.text || !reply.avatar){
		callback({
			code:410,
			desc:"EXPECTED_FIELD_NOT_SUPPLIED"
		});
		return;
	}
	simpledb.putAttributes({
		DomainName:config.db.dom.replies, 
		ItemName: idgen.idReply(reply, idgen.salt(32)),
		Attributes: [
			{Name:"parent", Value: reply.parent, Replace: true},
			{Name:"author", Value: reply.author, Replace: true},
			{Name:"text", Value: reply.text, Replace: true},
			{Name:"avatar", Value: reply.avatar, Replace: true},
			{Name:"time", Value: exports.zeroPad((new Date()).getTime(),32), Replace: true}]
	}, function(err, data){
		if(err){
			console.log(err);
			callback({
				code:500,
				desc:err
			});
			return;
		}else{
			exports.updatePost(reply.parent, function(key, value){
				if(key === "replies")
					return {Name:"replies", Value: exports.zeroPad(exports.unPad(value) + 1,64)};
				else
					return null;
			}, function(resp){
				if(resp.code !== 200){
					console.log(resp);
					callback(resp);
				}else{
					callback({
						code:200,
						desc:"SUCCESS"
					});
				}
			});
		}
	});
};

exports.getReplies = function(postid, token, callback){
	if(token === ""){
		token = null;
	}
	exports.query(exports.canned.replies(postid, token ? token.replace(/[^0-9]/g,"") : null), function(resp){
		if(resp.code !== 200 && resp.code !== 404){
			callback(resp);
		}else{
			var replies = [];
			var maxid = exports.zeroPad(0, 32);
			for(var i = 0; i < resp.desc.length; i++){
				var item = resp.desc[i];
				var reply = {};
				if(!item.Attributes)
					continue;
				for(var j = 0; j < item.Attributes.length; j++){
					reply[item.Attributes[j].Name] = item.Attributes[j].Value;
				}
				if(reply.time > maxid)
					maxid = reply.time;
				replies.push(reply);
			}
			callback({
				code:200,
				desc:replies,
				token: replies.length > 0 ? maxid : null
			});
		}
	});  
};

exports.getUser = function(username, callback){
	simpledb.getAttributes({
		DomainName:config.db.dom.users, 
		ItemName: username
		}, function (err, data){
		
		if (err){
			callback({
				code:500,
				desc:err
			});
			return;
		} else if ( data.Attributes === undefined  || data.Attributes.length < 1) {
			callback({
				code:404,
				desc:"NOT_FOUND"
			});
			return;
		} else {
			var user = {
				"fullname" : null,
				"email" : null,
				"username" : username,
				"password" : null,
				"birthday" : null,
				"interests": null,
				"affiliation": null,
				"defaultPrivacy": null,
				"profilePic": null,
				"lastLogin": 0
			};
			
			for(var i = 0; i < data.Attributes.length; i++){
				switch(data.Attributes[i]["Name"]){
					case "fullname":
					case "email":
					case "password":
					case "affiliation":
					case "defaultPrivacy":
					case "profilePic":
						user[data.Attributes[i]["Name"]] = data.Attributes[i]["Value"];
						break;
					case "interests":
						try{
							user[data.Attributes[i]["Name"]] = JSON.parse(data.Attributes[i]["Value"]);
						}catch(e){
							console.log(e);
							user[data.Attributes[i]["Name"]] = [];
						}
						break;
					case "birthday":
					case "lastLogin":
						user[data.Attributes[i]["Name"]] =new Date(data.Attributes[i]["Value"]);
						break;
					default:
						break;
				}
			}
			callback({
				code:200,
				desc: user
			});
			return;
		}
	});
};

exports.removeNotification = function(id, username, callback){
	exports.remove("SELECT * FROM " + config.db.dom.notification +" WHERE itemName() = '" + id + "' AND owner = '" + username + "'", config.db.dom.notification ,function(resp){
		callback(resp);
	});
};

exports.addNotification = function(notification, username, callback){
	if(!notification.text || notification.text === ""){
		callback({
			code:403,
			desc:"NOTIFICATION_REQUIRED_FIELD_NOT_GIVEN"
		});
		return;
	} else {
		simpledb.putAttributes({
			DomainName:config.db.dom.notification, 
			ItemName: idgen.idNotification(notification, username, idgen.salt(16)),
			Attributes: [
				{Name: "time", Value: exports.zeroPad((new Date()).getTime(),64), Replace: true},
				{Name: "owner", Value: username, Replace: true},
				{Name: "notification", Value: JSON.stringify(notification), Replace: true}
			]
		}, function(err,data){
			if(err){
				console.log("ADD_NOTIFICATION_FAILED");
				callback({
					code:500,
					desc:err
				});
				return;
			} else {
				callback({
					code:200,
					desc:"SUCCESS"
				});
				return;
			}
		});
	}
};

exports.removeFriend = function(username, friendname, callback){
	if(username === ""){
		return callback({
			code:500,
			desc:"USERNAME_NOT_GIVEN"
		});
	}
	exports.remove(exports.canned.friendship(username, friendname), config.db.dom.friends, function(resp){
		return callback(resp);
	});
};

exports.addFriend = function(username, friendname, callback){
	if(username === ""){
		return callback({
			code:500,
			desc:"USERNAME_NOT_GIVEN"
		});
	}
	exports.query(exports.canned.friendship(username, friendname), function(resp){
		if(resp.code !== 200 && resp.code !== 404){
			return callback(resp);
		}
		if(resp.code === 200){
			if(resp.desc.length === 2){
				// Already friends
				return callback({
					code:200,
					desc:"NOOP_ALREADY_FRIENDS"
				});
			} else {
				for(var i = 0; i < resp.desc.length; i++){
					if(resp.desc[i].Name === idgen.idRelationship(username, friendname)){
						return callback({
							code:200,
							desc:"NOOP_ALREADY_PENDING_FRIENDSHIP"
						});
					}
				}
				// Actually add
				// Drop to lower
			}
		}else{
			// No friendships found, we're adding them now
			// Drop to lower
		}
		simpledb.putAttributes({
			DomainName:config.db.dom.friends, 
			ItemName:idgen.idRelationship(username, friendname),
			Attributes: [
				{Name: "from", Value: username, Replace: true}, 
				{Name: "to", Value: friendname, Replace: true}]
		}, function(err, data){
			if(err){
				console.log(err);
				return callback({
					code: 500,
					desc: err
				});
			}else{
				return callback({
					code:200,
					desc:"SUCCESS"
				});
			}
		});
	});
};

exports.getRecommend = function(username, callback){
	if(username === ""){
		return callback({
			code:500,
			desc:"USERNAME_NOT_GIVEN"
		});
	}
	console.log(exports.canned.recommendations(username));
	exports.query(exports.canned.recommendations(username), function(resp){
		if(resp.code !== 200 && resp.code !== 404){
			console.log("Get recommendations failed!");
			console.log(resp);
			callback(resp);
			return;
		} else {
			if(resp.code === 404){
				callback({
					code:200,
					desc:[]
				});
				return;
			}else{
				var list = [];
				for(var i = 0; i < resp.desc.length; i++){
					var fobj = resp.desc[i];
					if(fobj.Attributes){
						for(var j = 0; j < fobj.Attributes.length; j++){
							if(fobj.Attributes[j].Name === "user"){
								list.push(fobj.Attributes[j].Value);
								break;
							}
						}
					}
				}
				// Get details
				var map = {};
				for(var i = 0; i < list.length; i++){
					map[list[i]] = null;
				}
				//Query users
				exports.queryUsers(map, function(r){
					if(r.code !== 200){
						return callback({
							code:501,
							desc:r.desc,
							list:list
						});
					}else{
						return callback({
							code:200,
							desc:list,
							list:r.desc
						});
					}
				});
			}
		}
	});
};

exports.getFriends = function(username, callback, expected){
	if(username === ""){
		return callback({
			code:500,
			desc:"USERNAME_NOT_GIVEN"
		});
	}
	exports.query(exports.canned.friends(username), function(resp){
		if(resp.code !== 200 && resp.code !== 404){
			// Error occurred
			console.log("Get friends for " + username + " failed");
			console.log(resp);
			callback(resp);
			return;
		}else{
			if(resp.code === 404){
				callback({
					code: 200,
					desc:[]
				});
				return;
			}else if(resp.code !== 200){
				callback(resp);
				return;
			}
			// Find
			var friendsIds = [];
			var pendingReq = [];
			var pendingResp = [];
			var relations = {};
			for(var i = 0; i < resp.desc.length; i++){
				var item = resp.desc[i];
				for(var j = 0; j < item.Attributes.length; j++){
					var attrib = item.Attributes[j];
					if(attrib.Value !== username){
						// This is a friend
						if(expected === "loose" || 
							(relations[attrib.Value] !== attrib.Name && relations[attrib.Value] != null)){
							if(friendsIds.indexOf(attrib.Value) < 0)
								friendsIds.push(attrib.Value);
							relations[attrib.Value] = "friend";
						}else{
							relations[attrib.Value] = attrib.Name;
						}
					}
				}
			}
			callback({
				code: 200,
				desc: friendsIds,
				rel: relations,
				username: username
			});
			return;
		}
	})
};

exports.auth = function(username, password, callback){
	// Authenticates a user given a username and password
	exports.getUser(username, function(resp){
		if(resp.code !== 200){
			callback(resp);
			return;
		} else {
			// Check credentials
			var user = resp.desc;
			if( user.password != null && 
				user.password === exports.hash(password, getSalt(user.password)) ){
				callback({
					code:200,
					desc:user
				});
				return;
			} else {
				callback({
					code:403,
					desc:"INVALID_CREDENTIALS"
				});
				return;
			}
		}
	});
};

exports.queryUsers = function(map, callback){
	var total = 0;
	for(var i in map){
		total++;
		exports.getUser(i, function(resp){
			if(resp.code === 200){
				map[resp.desc.username] = resp.desc;
				if(map[resp.desc.username]["password"]){
					map[resp.desc.username]["password"] = null;
					delete map[resp.desc.username]["password"];
				}
				total--;
			}else{
				total--;
			}
			if(total === 0){
				callback({
					code: 200,
					desc: map
				});
			}
		});
	}
};

exports.query = function (querySQL, callback){
	simpledb.select({
		SelectExpression: querySQL, 
		ConsistentRead: true
		}, function (err, data){
		
		if(err || !data){
			callback({
				code:500,
				desc:"RESPONSE_ERROR",
				details: err
			});
			if(err)
				console.log(err);
			return;
		}
		if(!data.Items){
			callback({
				code:404,
				desc:"NO_DATA"
			});
			return;
		}
		callback({
			code:200,
			desc:data.Items
		});
	});
};

// Removes all records found by querySQL. Works best only in small amounts
exports.remove = function(querySQL, domain, callback){
	exports.query(querySQL, function(data){
		if(data.code !== 200){
			if(data.code === 404){
				callback({
					code : 200,
					desc : "NO_OPERATION"
				});
			}else{
				callback(data);
			}
			return;
		}else{
			// Iterate through the items
			var items = data.desc;
			console.log("Removing " + items.length);
			var del = function(){
				if(items.length <= 0){
					callback({
						code:200,
						desc:"SUCCESS"
					});
					return;
				}
				var item = items.shift();
				console.log("Deleting!");
				simpledb.deleteAttributes({
					DomainName: domain,
					ItemName: item.Name,
					Attributes: item.Attributes
				}, function(err, resp){
					if(err){
						console.log(err);
						callback({
							code: 500,
							desc: "OPERATION_TERMINATED_WHILE_EXECUTING",
							error : err
						});
						return;
					}else{
						del();
					}
				});
			}
			del();
		}
	});
};

										
