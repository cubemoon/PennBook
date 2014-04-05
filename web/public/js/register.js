function _(e) { return document.getElementById(e); }
window.addEventListener("load", function(){
	$("#username").change(function(e){
		var self = this;
		$.post("/ajax/register/check", {
			username: this.value
		}, function(resp){
			if(typeof resp !== "object"){
				console.log(resp);
			}else{
				if(resp.desc === "AVAILABLE"){
					$(self).parent().removeClass("has-error").addClass("has-success");
				} else {
					$(self).parent().removeClass("has-success").addClass("has-error");
				}
			}
		});
	});
	
	$("#email").change(function(e){
		if(!(new RegExp('[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\\.[a-zA-Z]{2,4}')).test(this.value)){
			$(this).parent().removeClass("has-success").addClass("has-error");
			return;
		}
		var self = this;
		$.post("/ajax/checkregister", {
			email: this.value
		}, function(resp){
			if(typeof resp !== "object"){
				console.log(resp);
			}else{
				if(resp.desc === "AVAILABLE"){
					$(self).parent().removeClass("has-error").addClass("has-success");
				} else {
					$(self).parent().removeClass("has-success").addClass("has-error");
				}
			}
		});
	});
	
	$("#submit").click(function(e){
		if(e)
			e.preventDefault();
		if(_("password").value.length < 8){
			alert("Password must be 8 characters or more!");
			return;
		}
		if(_("password").value !== _("password-repeat").value){
			alert("Passwords do not match!");
			return;
		}
		if(!/^\d{4}-\d{1,2}-\d{1,2}$/g.test(_("birthday").value)){
			alert("Birthday illegal!");
			return;
		}else{
			var b = _("birthday").value.split("-");
			var d1 = parseInt(b[0].replace(/^0+/g,"")),
				d2 = parseInt(b[1].replace(/^0+/g,"")),
				d3 = parseInt(b[2].replace(/^0+/g,""));
			if(d1 < 1890 || d1 > (new Date()).getFullYear()){
				alert("Birthday year illegal");
				return;
			}else if(d2 <= 0 || d2 > 12){
				alert("Birthday month illegal");
				return;
			}else if(d3 <= 0 || d3 > 31){
				alert("Birthday date illegal");
				return;
			}
		}
		if(_("username").value == "" || _("fullname").value == ""){
			alert("Please fill in your name/username");
			return;
		}
		
		$.post("/ajax/register", {
			username: _("username").value,
			fullname: _("fullname").value,
			email: _("email").value,
			password : _("password").value,
			affiliation: _("affiliate").value,
			interests: _("interests").value,
			birthday:_("birthday").value
		}, function(resp){
			if(resp.code === 200){
				window.location.href = "/login";
			}else{
				alert(resp.desc);
				return;
			}
		}).fail(function(){
			alert("Failed due to network problems.\n Check your internet connection.");
			return;	
		});
	});
});
