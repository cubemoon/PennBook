var PK_NOTIFICATIONS = new function(){
	var timer = 0;
	var messages = [];
	var msgTable = {};
	var username = null;
	var render = {
		list: null,
		badge: null
	};
	var inited = false;
	this.enableTimer = true;
	
	var generateListener = function(obj, key, elem){
		return function(e){
			console.log(obj);
			if(e && e.preventDefault)
				e.preventDefault();
			var k = key;
			$.get("/ajax/notifications/remove/" + obj.id,{},function(resp){
				console.log(resp);
				if(obj != null && obj.link != null)
					window.location.href = obj.link;
				if(messages.indexOf(k) >= 0){
					messages.splice(messages.indexOf(k), 1);
				}
				delete msgTable[k];
				try{
					elem.parentNode.removeChild(elem);
				} catch (e){
					console.log(e);
				}
				PK_NOTIFICATIONS.render();
				PK_NOTIFICATIONS.save();
			});
		};
	}
	
	this.getIndex = function(){
		return messages;
	};
	
	this.clearTimer = function(){
		clearInterval(timer);
	};
	
	this.startTimer = function(){
		if(!this.enableTimer)
			return;
		var self = this;
		timer = setInterval(function(){
			self.check();
		}, 5000);
	};
	
	this.get = function(){
		if(!localStorage)
			localStorage = {};
		try{
			var r = JSON.parse(localStorage["notifications"]);
			messages = r.messages;
			msgTable = r.table;
			username = r.username;
		}catch(e){
			messages = [];
			msgTable = {};
			localStorage["notifications"] = JSON.stringify({
				messages : [],
				table : {},
				username: ""
			});
		}
	};
	
	this.save = function(){
		localStorage["notifications"] = JSON.stringify({
			messages: messages,
			table: msgTable,
			username: username
		});
	};
	
	this.check = function(){
		// Use the client's localstorage
		// If it doesnt exist we just hit memory
		if(!localStorage)
			localStorage = {};
		if(!localStorage["lastCheck"]){
			localStorage["lastCheck"] = 0;
		}
		if(!localStorage["token"]){
			localStorage["token"] = "";
		}
		var self = this;
		// Send the request and poll for new messages
		$.get("/ajax/notifications",{
			"q":localStorage["token"],
			"r": (new Date()).getTime()
		}, function(resp){
			if(typeof resp === "object" && resp.code === 200){
				if(resp.username !== username){
					//clear everyting
					username = resp.username;
					messages = [];
					msgTable = {};
					localStorage["token"] = "";
					self.save();
					return;
				}
				// Update
				if(resp.token)
					localStorage["token"] = resp.token;
				// Depending on if we have new stuff, render
				self.get();// This is to prevent race conditions with multiple browser tabs open
				for(var i = 0; i < resp.data.length; i++){
					if(messages.indexOf(resp.data[i].hash) >= 0)
						continue;
					
					messages.push(resp.data[i].hash);
					msgTable[resp.data[i].hash] = {
						text: resp.data[i].text,
						link: resp.data[i].url,
						id: resp.data[i].id,
					};
				}
				self.render(messages);
				self.save();
			}
		});
		// save check
		localStorage["lastCheck"] = (new Date()).getTime();
	};
	
	this.initStore = function(){
		if(inited === true){
			return;
		}
		this.get();
		inited = true;
	};
	
	this.setRenderTargets = function(list, badge){
		render.list = list;
		render.badge = badge;
	};
	
	this.render = function(list){
		// Init from store
		this.initStore();
		if(!render.list || !render.badge)
			return console.log("ERROR: Render targets not set!");
		if(messages.length > 0){
			render.badge.css("display","");
			render.badge.text(messages.length);
		}else{
			render.badge.css("display","none");
			render.list.html("<li><a><div class='notification c'>Nothing new here ...<br> Move along now</div></a></li>");
			return;
		}
		
		render.list.html("");
		if(!list) list = messages;
		var last = null;
		for(var i = 0; i < list.length; i++){
			// Add the messages to the list
			var newDom = document.createElement("div");
			newDom.className = "notification";
			newDom.appendChild(document.createTextNode(msgTable[list[i]].text));
			var linkContainer = document.createElement("a");
			linkContainer.addEventListener("click", generateListener(msgTable[list[i]], list[i], newDom));
			linkContainer.href = msgTable[list[i]].link ? msgTable[list[i]].link : "#";
			linkContainer.appendChild(newDom);
			var link = document.createElement("li");
			link.appendChild(linkContainer);
			if(last === null)
				render.list.append(link);
			else
				$(last).before(link);
			last = link;
		}
	};
};

window.addEventListener("load", function(){
	// Hook an update timer
	PK_NOTIFICATIONS.startTimer();
	PK_NOTIFICATIONS.setRenderTargets($("#notifications-menu"), $("#notifications-badge"));
	PK_NOTIFICATIONS.render();
});
