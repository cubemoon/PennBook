var db = require("./models/mSimpleDB.js");
var config = require("./config.js");
var fs = require("fs");

function writeFile(data){
	fs.writeFile("edges.txt","", function(){
		//Create or overwrite old file
		for(var x in data){
			var edge = x.split(":");
			fs.writeFileSync("edges.txt",edge[0] + "\t" + edge[1] + ";" + (data[x] =="single" ? "pending" : "friend") + "\n", {flag:"a"});
		}
	});
};

db.init(config);
db.query("SELECT * FROM " + config.db.dom.friends, function(resp){
	if(resp.code !== 200 && resp.code !== 404){
		console.log("Read Friends info Failed");
		return;
	}
	var map = {};
	if(resp.code === 404){
		writeFile(map, function(r){
			if(r.code === 200){
				console.log("Success!");
			}else{
				console.log("Failed");
			}
		});
	}else{
		for(var i = 0; i < resp.desc.length; i++){
			var edge = resp.desc[i];
			map[edge.Name] = "single";
			if(!edge.Attributes){
				console.log(edge);
				console.log("No Attributes");
				continue;
			}
			var pair = {};
			for(var j = 0; j < edge.Attributes.length; j++){
				pair[edge.Attributes[j].Name] = edge.Attributes[j].Value;
			}
			if(map[pair["to"] + ":" + pair["from"]]){
				delete map[pair["to"] + ":" + pair["from"]];
				map[edge.Name] = "dual";
			}			
		}
		writeFile(map, function(r){
			if(r.code === 200){
				console.log("Success!");
			}else{
				console.log("Failed");
			}
		});
	}
});
