window.addEventListener("load", function(){
	var SEARCH = {
		LAST_RETURNED : 0,
		CACHED_DATA : [],
		SCHED : 0
	};
	
	var search_check = function(query, callback){
		$.get("/ajax/search", {
			"q": query
		}, function(resp){
			if(typeof resp === "object" && resp.code === 200){
				callback(resp.desc);
			}else{
				callback(SEARCH["CACHED_DATA"]);
			}
		}).fail(function(){
			callback(SEARCH["CACHED_DATA"]);
		});
	};
	$("#search").typeahead({
		"source": function(input, callback){
			if(input == ""){
				callback([]);
				return;
			}
			// Call the server to do a fuzzy lookup of people only if it has 
			// already returned
			if((new Date()).getTime() - SEARCH['LAST_RETURNED'] > 600){
				clearTimeout(SEARCH.SCHED);
				search_check(input, function(resp){
					SEARCH['LAST_RETURNED'] = (new Date()).getTime();
					SEARCH['CACHED_DATA'] = resp;
					callback(resp);
				});
			}else{
				// Schedule another check for later and expire any already 
				// scheduled checks
				clearTimeout(SEARCH.SCHED);
				SEARCH.SCHED = setTimeout(function(){
					search_check(input, function(resp){
						SEARCH['LAST_RETURNED'] = (new Date()).getTime();
						SEARCH['CACHED_DATA'] = resp;
						callback(resp);
					});
				}, 300);
				// Use the old cache if possible, the request will come later to 
				// augument this
				callback(SEARCH['CACHED_DATA']);
			}
		},
		"items":6
	});
});
