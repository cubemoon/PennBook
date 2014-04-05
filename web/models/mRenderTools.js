exports.parse = function(req){
	var page = req.url.split('/');
	page.shift();
	if(page[0] == "user")
		if(page[1] != "settings")
			return "timeline";
	return "home";
};

exports.nonce = function(){
	return Math.round(Math.random() * 10000) + Math.floor(Math.random() * 2000);
};
