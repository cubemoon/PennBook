/**
* The main user facing js library. This is for the main page.
*/
// Require that feedobject be initialized
var PK_STATUS = {
	checkForm:function(){
		var frm = _("new-post");
		if(!frm)
			return false;
		if(frm.statustext.value.length < 1)
			return false;
		return true;
	},
	fillForm: function(data){
		for(var x in data){
			PK_STATUS.setPkParam(x, data[x]);
		}
	},
	post: function(type, data, callback){
		try{
			$.post('/ajax/post/' + type, data, function(resp) {
				if(callback)
					callback(resp);
			});
		}catch(e){
			callback(null);
		}
	},
	getPkParam: function(param){
		var frm = _("new-post");
		if(!frm || !frm[param])
			return null;
		return frm[param].value;
	},
	setPkParam: function(param, value){
		var frm = _("new-post");
		if(!frm || !frm[param]){
			console.log("[Err]Set PK Param Failed for " + param + ":" + value); 
			return false;
		}
		frm[param].value = value;
		return true;
	},
};

var PK_CACHE = {
	uref : {}
};

var PK_REFRESH = {
	last: 0,
	hasReturned: true,
	lastOnlineCheck: 0,
	online: []
};

/** ---------------------------------------------------------------------------
TODO THIS IS THE ACTUAL LOADER, CLASS DEFINITIONS PRECEED THIS LINE
---------------------------------------------------------------------------- **/
window.addEventListener("load", function(){
	// OK, now we can hook everything
	// BIND: The post area
	$("#privacy-public").click(function(e){
		if(e)
			e.preventDefault();
		$("#privacy-" + PK_STATUS.getPkParam("stprivacy")).parent().removeClass("active");
		$("#privacy-public").parent().addClass("active");
		PK_STATUS.setPkParam("stprivacy","public");
		_("btn-privacy").innerHTML = _("privacy-" + PK_STATUS.getPkParam("stprivacy")).innerHTML 
			+ "&nbsp;<span class='caret'></span>";
	});
	$("#privacy-friends").click(function(e){
		if(e)
			e.preventDefault();
		$("#privacy-" + PK_STATUS.getPkParam("stprivacy")).parent().removeClass("active");
		$("#privacy-friends").parent().addClass("active");
		PK_STATUS.setPkParam("stprivacy","friends");
		_("btn-privacy").innerHTML = _("privacy-" + PK_STATUS.getPkParam("stprivacy")).innerHTML
			+ "&nbsp;<span class='caret'></span>";
	});
	$("#privacy-private").click(function(e){
		if(e)
			e.preventDefault();
		$("#privacy-" + PK_STATUS.getPkParam("stprivacy")).parent().removeClass("active");
		$("#privacy-private").parent().addClass("active");
		PK_STATUS.setPkParam("stprivacy","private");
		_("btn-privacy").innerHTML = _("privacy-" + PK_STATUS.getPkParam("stprivacy")).innerHTML 
			+ "&nbsp;<span class='caret'></span>";
	});
	$(".ptype").click(function(e){
		if(e)
			e.preventDefault();
		$("#post-type-" + PK_STATUS.getPkParam("sttype")).removeClass("btn-info").addClass("btn-default");
		$(this).removeClass("btn-default").addClass("btn-info");
		PK_STATUS.setPkParam("sttype", this.id.split("-")[2]);
		//Load the corresponding interfaces
	});
	$("#post-btn").click(function(e){
		if(e)
			e.preventDefault();
		//Check post
		if(!PK_STATUS.checkForm()){
			$("#new-post").addClass("has-error");
			$("#alert-post").css("display","");
			$("#alert-post").removeClass("alert-danger alert-success alert-info alert-warning");
			$("#alert-post").addClass("alert-danger");
			$("#alert-post").text("Please check your input.");
			return;
		}
		$("#new-post").removeClass("has-error");
		$("#alert-post").css("display","none");
		$("#alert-post").removeClass("alert-danger alert-success alert-info alert-warning");
		PK_STATUS.post(PK_STATUS.getPkParam("sttype"),{
			content: PK_STATUS.getPkParam("statustext"),
			privacy: PK_STATUS.getPkParam("stprivacy"),
		}, function(resp){
			if(typeof resp === "object" && resp.code === 200){
				PK_STATUS.fillForm({
					statustext:""
				});
				$("#alert-post").css("display","");
				$("#alert-post").removeClass("alert-danger alert-success alert-info alert-warning");
				$("#alert-post").addClass("alert-success");
				$("#alert-post").text("Success!");
			}else{
				$("#alert-post").css("display","");
				$("#alert-post").removeClass("alert-danger alert-success alert-info alert-warning");
				$("#alert-post").addClass("alert-danger");
				$("#alert-post").text("Something went wrong while posting : " + resp.code + " " + resp.desc);
			}
		});
	});
	// Bind the right sidebar
	$(".filters-list-item").click(function(e){
		if(e)
			e.preventDefault();
		$(".filters-list-item").removeClass("active");
		$(this).addClass("active");
		var x = this.id.split("-");
		if(x.length > 1){
			switch(x[1]){
				case "newsfeed":
					$(".type-image").show(200);
					$(".type-share").show(200);
					$(".type-status").show(200);
					$(".type-wall").show(200);
					break;
				case "shares":
					$(".type-image").hide(200);
					$(".type-share").show(200);
					$(".type-status").hide(200);
					$(".type-wall").hide(200);
					break;
				case "images":
					$(".type-image").show(200);
					$(".type-share").hide(200);
					$(".type-status").hide(200);
					$(".type-wall").hide(200);
					break;
			}
		}
	});
	// We unbind the notifications autocheck if it exists to minimize timers
	if(PK_NOTIFICATIONS){
		PK_NOTIFICATIONS.enableTimer = false;
		PK_NOTIFICATIONS.clearTimer();
	}
	// Now bind the refresh
	var refresh = function(){
		// We refresh every 5s interval
		// Note that this setting makes us able to schedule the checks
		// At a real interval, and also makes it possible to reschedule checks
		if((new Date()).getTime() - PK_REFRESH.last > 5000){
			// Check
			if(PK_REFRESH.hasReturned){
				//If we got last dataset, we schedule a new one.
				//Otherwise we skip this cycle
				$.get("/ajax/newsfeed",{
					token:(new Date()).getTime() + "." + Math.random() // This, so chrome doesnt cache it across sessions
				},function(resp){
					if(typeof resp !== "object"){
						try{
							resp = JSON.parse(resp);
						}catch(e){return;}
					}
					if(resp.code === 200){
						PK_FEED.username = resp.username;
						for(var i = 0; i < resp.desc.length; i++){
							var feeditem = PK_FEED.insert(resp.desc[i]);
							if(feeditem){
								console.log(feeditem);
								var nextItem = PK_FEED.next(feeditem);
								if(nextItem && nextItem.dom){
									$(nextItem.dom).before(PK_FEED.getDOM(feeditem.id));
								}else{
									$("#feed-stream").append(PK_FEED.getDOM(feeditem.id));
								}
							}else{
								if(resp.desc[i].hash){
									var old = PK_FEED.getByHash(resp.desc[i].hash);
									var oldItem = PK_FEED.get(old.id);
									if(oldItem.replies != resp.desc[i].replies || oldItem.likes != resp.desc[i].likes){
										oldItem.replies = resp.desc[i].replies;
										oldItem.likes = resp.desc[i].likes;
										$("#like-stats-" + old.id).text(oldItem.likes + " Likes " + oldItem.replies + " Replies");
									}
								}
							}
						}
					}
				}).always(function(){
					PK_REFRESH.hasReturned = true;
				});
			}
			
			if(PK_NOTIFICATIONS){
				PK_NOTIFICATIONS.check();
			}
			PK_REFRESH.last = (new Date()).getTime();
		}
		
		if((new Date()).getTime() - PK_REFRESH.lastOnlineCheck > 5000){
			// Check for online list every 5s.
			$.get("/ajax/online", {
				t: Math.random()
			},function(resp){
				if(resp.code === 200){
					// Online Users
					var u = [];
					for(var i = 0; i < resp.desc.length; i++){u.push(resp.desc[i].username);}
					for(var n in PK_CACHE.uref){
						if(u.indexOf(n) < 0){
							if(PK_CACHE.uref[n].dom.parentNode){
								PK_CACHE.uref[n].dom.parentNode.removeChild(PK_CACHE.uref[n].dom);
							}
							delete PK_CACHE.uref[n];
						}
					}
					for(var i = 0; i < resp.desc.length; i++){
						if(PK_CACHE.uref[resp.desc[i].username] == null){
							//Add it
							PK_CACHE.uref[resp.desc[i].username] = resp.desc[i];
							var userAvatar = _$("a",{
								className:"nd",
								href:"/user/" +resp.desc[i].username},_$("div", {style:{"clear":"both"}}, 
									[_$("img",{
										src:resp.desc[i].avatar,
										className:"img-responsive avatar-small"
									}), 
									resp.desc[i].fullname]));
							$("#online-friends").append(userAvatar);
							PK_CACHE.uref[resp.desc[i].username].dom = userAvatar;
						}
					}
				}
			});
			
			PK_REFRESH.lastOnlineCheck = (new Date()).getTime();
		}
	};
	setInterval(refresh,1000);
	refresh();
	
	// Finally we get recommendation info ad add it
	$.get("/ajax/recommend", {}, function(resp){
		if(resp.code === 200){
			// Add 
			for(var i = 0; i < resp.desc.length; i++){
				$("#recommend").append(_$("a",{
					className:"nd",
					href:"/user/" +resp.desc[i]},_$("div", {style:{"clear":"both"}}, 
						[_$("img",{
							src:resp.list[resp.desc[i]].avatar,
							className:"img-responsive avatar-small"
						}), 
					resp.list[resp.desc[i]].fullname])));
			}
		}
	});
});
