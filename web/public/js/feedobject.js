
//So we don't conflict with jQuery.
var _ = function(e){return document.getElementById(e);}

//The very useful boilerplate for element creation
var _$ = function(type,init,inner, callback){
	var elem = document.createElement(type);
	for(var i in init){
		if(i != 'style'){
			elem[i] = init[i];
		}else{
			for(var j in init[i]){
				elem['style'][j] = init[i][j];
			}
		}
	}
	if(typeof inner == "string")
		elem.appendChild(document.createTextNode(inner));
	else if(typeof inner == "object" && typeof inner.length == "number"){
		for(var i = 0; i < inner.length; i++){
			if(typeof inner[i] == "string")
				elem.appendChild(document.createTextNode(inner[i]));
			else
				elem.appendChild(inner[i]);
		}
	}
	else if(typeof inner != "undefined" && inner != null)
		elem.appendChild(inner);
	if(callback)
		callback(elem);
	return elem;
};

// Add binary search and binary insert into array prototype
Array.prototype.bsearch = function(what,how){
	if(this.length == 0) return 0;
	if(how(what,this[0]) < 0) return 0;
	if(how(what,this[this.length - 1]) >=0) return this.length;
	var low =0;
	var i = 0;
	var count = 0;
	var high = this.length - 1;
	while(low<=high){
		i = Math.floor((high + low + 1)/2);
		count++;
		if(how(what,this[i-1])>=0 && how(what,this[i])<0){
			return i;
		}else if(how(what,this[i-1])<0){
			high = i-1;
		}else if(how(what,this[i])>=0){
			low = i;
		}else
			console.error('Program Error');
		if(count > 1500) console.error('Too many run cycles.');
	}
	return -1;
};
Array.prototype.binsert = function(what,how){
	this.splice(this.bsearch(what,how),0,what);
};

var PK_FEED = new function(){
	var feedAbst = [];
	var feedMap = {};
	var idAssign = 0;
	var idRecycle = [];
	var seen = {};
	this.username = null;
	// Dynamically updates the news feed appending to positions as needed
	// feedAbst is always kept in decreasing time order and we can binary insert
	this.size = function(){
		return feedAbst.length;
	};
	this.find = function(feed){
		// Find this feed
		if(feed == null)
			return -1;
		if(feed.publish != null){
			//Use bsearch to find it
			return feedAbst.bsearch(feed, function(a, b){
				if(a.publish < b.publish) return 1;
				if(a.publish > b.publish) return -1;
				return 0;
			}) - 1;
		}else{
			//Brute force it.
			for(var i = 0; i < feedAbst.length; i++){
				if(feedAbst[i].id == feed.id){
					return i;
				}
			}
		}
		return -1; // Not found
	};
	
	this.insert = function(feed){
		if(feed.hash && seen[feed.hash]){
			return; // Don't insert it again
		}
		//Generate a simplified form of the feed.
		var simplified = {
			"publish": feed.time,
			"hash": feed.hash,
			"id": "f" + idAssign
		};
		// B-Insert it into feedAbst
		feedAbst.binsert(simplified, function(a, b){
			if(a.publish < b.publish)
				return 1;
			else if (a.publish == b.publish)
				return 0;
			return -1;
		});
		// Also allocate it into feed map
		feedMap["f" + idAssign] = feed;
		// Increase id
		idAssign++;
		// Add the hash to seen
		if(feed.hash)
			seen[feed.hash] = simplified;
		return simplified;
	};
	
	this.remove = function(feed){
		// Find this feed
		var fid = this.find(feed);
		if(fid >= 0){
			feedAbst.splice(fid, 1);
		}
		delete feedMap[feed.id];
		delete seen[feed.hash];
		// Recycle the id
		idRecycle.push(feed.id);
	};
	
	this.get = function(id){
		return feedMap[id];
	};
	
	this.getByHash = function(hash){
		return seen[hash];
	};
	
	this.next = function(feed, type){
		var thisid = this.find(feed);
		if(thisid < 0)
			return null;
		if(thisid >= feedAbst.length - 1)
			return null;
		if(type !== "abstract")
			return feedMap[feedAbst[thisid + 1].id];
		else
			return feedAbst[thisid + 1];
	};
	
	this.getDOM = function(id){
		if(!feedMap[id])
			return;
		if(feedMap[id].dom)
			return feedMap[id].dom;
		// Generate the dom object
		var dom = document.createElement("div");
		dom.setAttribute("id", "feed-item-" + id);
		dom.className = "status panel panel-default type-" + feedMap[id].type;
		// Create body and buttons
		var replybody = _$("div", {className:"input-group"});
		var replytext = _$("input",{type:"text", className:"form-control"});
		replybody.appendChild(replytext);
		var postbtn = _$("button",{className:"btn btn-primary"}, ["Post"]);
		replybody.appendChild(_$("span",{className:"input-group-btn"},postbtn));
		
		
		var b = _$("div",{className: "panel-body"}), h = _$("div", {className: "panel-heading"}),
			rt = _$("div",{className: "panel-body", style:{display:"none"}}),
			r = _$("div",{className: "panel-body reply-form", style:{display:"none"}}, [_$("form",{className:"form-inline"},replybody)]);
		dom.appendChild(b);
		dom.appendChild(h);
		dom.appendChild(rt);
		dom.appendChild(r);
		// Fill in body
		if(feedMap[id].pic){
			var avatar = _$("img",{src:feedMap[id].pic, className:"avatar"});
			var avatarLink = _$("a", {href:("/user/" + feedMap[id].author)}, avatar);
			b.appendChild(avatarLink);
		}
		var text = _$("p", {}, feedMap[id].text);
		b.appendChild(text);
		// Fill in buttons
		var like = _$("a",{className:"nd",href:"#"},[_$("span",{className:"glyphicon glyphicon-thumbs-up"}), " Like"]), 
			reply = _$("a",{className:"nd",href:"#"}, [_$("span",{className:"glyphicon glyphicon-comment"}), " Reply"]);
		var right = _$("div",{className: "pull-right"}, [like, "\xA0\xA0", reply]);
		$(like).click(function(e){
			if(e)
				e.preventDefault();
			$.post("/ajax/like", {
				index : feedMap[id].hash
			}, function(data){
				// Do nothing
			});
		});
		feedMap[id]["replyToGuy"] = feedMap[id].author;
		$(reply).click(function(e){
			if(e)
				e.preventDefault();
			// Load replies
			feedMap[id]["replyToGuy"] = feedMap[id].author;
			$.get("/ajax/reply/" + feedMap[id].hash,{
				token: feedMap[id].replykey ? feedMap[id].replykey : ""
			},function(resp){
				if(resp.code === 200){
					if(!feedMap[id].replyList)
						feedMap[id].replyList = [];
					feedMap[id].replykey = resp.token;
					for(var i = resp.desc.length - 1; i >= 0; i--){
						var rp = resp.desc[i];
						if(feedMap[id].replyList.indexOf(rp) < 0){
							feedMap[id].replyList.push(rp);
							$(_$("div",{className: "panel-body reply", style:{}}, [
								_$("a",{href:"/user/" + rp.author},_$("img", {src:rp.avatar, className :"avatar-small"})),
								rp.text, 
								_$("a",{className:"pull-right", href:"#"}, ["Reply"], function(link){
									$(link).click(function(e){
										if(e)
											e.preventDefault();
										if(feedMap[id]["replyToGuy"] != rp.author || 
											feedMap[id]["replyToGuy"] == feedMap[id].author){
											feedMap[id]["replyToGuy"]  = rp.author;
											$(replytext).val("Reply to " + rp.author + ": " + $(replytext).val());
										}
										$('html, body').animate({
											scrollTop: Math.ceil($(replytext).offset().top - 320,0)
										}, 800);
									});
								})])).insertBefore(r);
						}
					}
				}
			});
			r.style.display = "";
		});
		
		$(postbtn).click(function(e){
			if(e)
				e.preventDefault();
			if($(replytext).val() === "")
				return;
			$.post("/ajax/reply", {
				postid: feedMap[id].hash,
				text: $(replytext).val(),
				target: feedMap[id]["replyToGuy"]
			}, function(resp){
				if(resp.code === 200){
					feedMap[id].replies++;
					$("#like-stats-" + id).text(feedMap[id].likes + " Likes " + feedMap[id].replies + " Replies");
					$(replytext).val("");
					$(reply).click();
				}else{
					alert("Error while replying!");
				}
			});
		});
		
		h.appendChild(right);
		console.log(feedMap[id]);
		if(feedMap[id].type === "wall"){
			if(feedMap[id].target !== PK_FEED.username){
				h.appendChild(_$("span",{style:{color:"#f88"}}, "Posted on " + feedMap[id]["target"] + "'s wall.\xA0 ")); 
			} else {
				h.appendChild(_$("span",{style:{color:"#88f"}}, "Posted on your wall.\xA0 ")); 
			}
		}
		h.appendChild(_$("span",{
				id:"like-stats-" + id, 
				title: "Posted " + (new Date(feedMap[id].time)).toString()
			},feedMap[id].likes + " Likes " + feedMap[id].replies + " Replies", function(t){
				t.setAttribute("data-toggle", "tooltip");
				t.setAttribute("title", "Posted " + (new Date(feedMap[id].time)).toString());
				$(t).tooltip("show");
			}));
		if(feedMap[id].author == PK_FEED.username){
			h.appendChild(_$("span",{style:{color:"#888"}}, "\xA0(" + feedMap[id].privacy + ") "));
		}
		feedMap[id].dom = dom;
		return dom;
	};
};
