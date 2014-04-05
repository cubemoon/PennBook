function check(user){
	$.get("/ajax/timeline/" + user,{
		token:(new Date()).getTime()
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
					var nextItem = PK_FEED.next(PK_FEED.next(feeditem,"abstract"));
					if(nextItem && nextItem.dom){
						$(nextItem.dom).before(PK_FEED.getDOM(feeditem.id));
					}else{
						if(PK_FEED.size() % 2 === 0){
							$("#col-right").append(PK_FEED.getDOM(feeditem.id));
						}else{
							$("#col-left").append(PK_FEED.getDOM(feeditem.id));
						}
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
	});
}

window.addEventListener("load", function(){
	if(!$)
		return alert("JQuery Not initialized");
	if(!PK_FEED)
		return alert("Feedobject Not initialized");
	check($("#pusername").val());
	$("#post-btn").click(function(e){
		if(e)
			e.preventDefault();
		var username = $("#pusername").val();
		var stext = $("#statustext").val();
		if(stext === ""){
			$("#statustext").css("background","#fdd");
			return;
		}
		if(username === ""){
			alert("Error. Could not post. Please refresh page.");
			return;
		}
		$(this).attr("disabled", true);
		$(this).text("Please Wait...");
		$.post("/ajax/post/wall", {
			content: stext,
			target: username,
			privacy: "public"
		},function(resp){
			if(resp.code === 200){
				$("#statustext").css("background","#fff");
				$("#statustext").val("");
			}else{
				alert("Post Failed with " + resp.code + ": " + resp.desc);
			}
		}).always(function(){
			$("#post-btn").removeAttr("disabled");
			$("#post-btn").text("Post");
			check($("#pusername").val());
		});
	});
	
	$("#add-friend").click(function(e){
		if(e)
			e.preventDefault();
		var self = this;
		var mode = "add";
		if($(self).hasClass("btn-success")){
			mode = "approve";
		}
		var username = $("#pusername").val();
		if(!username)
			return alert("Network Error: Please Refresh Page.");
		$(self).attr("disabled", true);
		$.post("/ajax/friend/add", {
			target: username,
			mode: mode
		}, function(resp){
			if(resp.code === 200){
				//$(self).removeClass("btn-primary");
				$(self).attr("disabled", true);
				$(self).text("Friend Request Sent");
			}else{
				alert("Add Friend Failed! \n" + resp.code + ":" + resp.desc);
				$(self).removeAttr("disabled");
			}
		}).fail(function(){
			$(self).removeAttr("disabled");
			alert("Communication Failed. \nPlease check your internet connection.");
		});
	});
	
	$("#remove-friend").click(function(e){
		if(e)
			e.preventDefault();
		var self = this;
		var username = $("#pusername").val();
		if(!username)
			return alert("Network Error: Please Refresh Page.");
		$(self).attr("disabled", true);
		$.post("/ajax/friend/remove", {
			target: username
		}, function(resp){
			if(resp.code === 200){
				//$(self).removeClass("btn-primary");
				$(self).attr("disabled", true);
				$(self).text("Removed");
			}else{
				alert("Remove Friend Failed! \n" + resp.code + ":" + resp.desc);
				$(self).removeAttr("disabled");
			}
		}).fail(function(){
			$(self).removeAttr("disabled");
			alert("Communication Failed. \nPlease check your internet connection.");
		});
	});
	
});
