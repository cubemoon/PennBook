window.addEventListener("load", function(){
	var setNonce = function(value){
		$("#nonce").val(value);
	};
	
	var getNonce = function(){
		return $("#nonce").val();
	};
	
	$("#set-gen").click(function(e){
		if(e)
			e.preventDefault();
		$("#set-gen").addClass("active");
		$("#set-priv").removeClass("active");
		$("#settings-privacy").css("display", "none");
		$("#settings-general").css("display", "");
	});
	$("#set-priv").click(function(e){
		if(e)
			e.preventDefault();
		$("#set-priv").addClass("active");
		$("#set-gen").removeClass("active");
		$("#settings-general").css("display", "none");
		$("#settings-privacy").css("display", "");
	});
	
	//Hook the "Change" buttons
	$("#change-name").click(function(e){
		if(e)
			e.preventDefault();
		if($("#fullname").val() === ""){
			alert("You cannot set your name to blank!");
			return;
		}
		$.post("/ajax/settings/fullname", {
			nonce: getNonce(),
			value: $("#fullname").val()
		}, function(resp){
			if(resp.nonce){
				setNonce(resp.nonce);
			}
			if(resp.code === 200){
				$("#fullname").css("background", "#aaffaa");
			}else{
				alert("Error " + resp.code + " : " + resp.desc);
				return;
			}
		});
	});
	
	$("#change-password").click(function(e){
		if(e)
			e.preventDefault();
		if($("#password").val().length < 8){
			alert("You cannot set your password to less than 8 characters");
			return;
		}
		$.post("/ajax/settings/password", {
			nonce: getNonce(),
			value: $("#password").val()
		}, function(resp){
			if(resp.nonce){
				setNonce(resp.nonce);
			}
			if(resp.code === 200){
				$("#password").css("background", "#aaffaa");
			}else{
				alert("Error " + resp.code + " : " + resp.desc);
				return;
			}
		});
	});
	
	$("#change-interests").click(function(e){
		if(e)
			e.preventDefault();
		$.post("/ajax/settings/interests", {
			nonce: getNonce(),
			value: $("#interests").val()
		}, function(resp){
			if(resp.nonce){
				setNonce(resp.nonce);
			}
			if(resp.code === 200){
				$("#interests").css("background", "#aaffaa");
			}else{
				alert("Error " + resp.code + " : " + resp.desc);
				return;
			}
		});
	});
	
	$("#change-email").click(function(e){
		if(e)
			e.preventDefault();
		if($("#email").val() === ""){
			alert("You cannot set your email to blank!");
			return;
		}
		$.post("/ajax/settings/email", {
			nonce: getNonce(),
			value: $("#email").val()
		}, function(resp){
			if(resp.nonce){
				setNonce(resp.nonce);
			}
			if(resp.code === 200){
				$("#email").css("background", "#aaffaa");
			}else{
				alert("Error " + resp.code + " : " + resp.desc);
				return;
			}
		});
	});
	
	$("#change-affiliation").click(function(e){
		if(e)
			e.preventDefault();
		if($("#affiliation").val() === ""){
			alert("You cannot set your affiliation to blank!");
			return;
		}
		$.post("/ajax/settings/affiliation", {
			nonce: getNonce(),
			value: $("#affiliation").val()
		}, function(resp){
			if(resp.nonce){
				setNonce(resp.nonce);
			}
			if(resp.code === 200){
				$("#affiliation").css("background", "#aaffaa");
			}else{
				alert("Error " + resp.code + " : " + resp.desc);
				return;
			}
		});
	});
});
