var crypto = require("crypto");
/*
	This generates all the IDs to use in tags
*/

function hash(obj, salt){
	var shasum = crypto.createHash('sha1');
	if(salt){
		shasum.update(JSON.stringify(obj) + ",SALT=" + salt);
	}else{
		shasum.update(JSON.stringify(obj));
	}
	return shasum.digest("hex");
}

exports.salt = function(len, set){
	var text = "";
    var charset = set ? set : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
};

exports.idPost = function(p, salt){
	return hash(p, salt) + (new Date()).getTime();
};

exports.idReply = function(p, salt){
	return "R_" + hash(p, salt) + (new Date()).getTime();
};

exports.idLike = function(user, p){
	return user + ":" + p;
};

exports.idNotification = function(n, owner, salt){
	return owner + ":" + hash(n, salt) + (new Date()).getTime();
};

exports.idRelationship = function(from, to){
	return from + ":" + to;
};
