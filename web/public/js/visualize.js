function buildJSONFromList(user, friends){
	var buildRoot = {
		id: user,
		name: user,
		data:{},
		children:[]
	};
	for(var i = 0; i < friends.length; i++){
		buildRoot.children.push({
			id:friends[i],
			name: friends[i],
			data:{},
			children:[]
		});
	};
	return buildRoot;
};

window.addEventListener("load", function(){
	$.getJSON('/ajax/friends', function (json){
		console.log(json);
		if(typeof json !== "object" || json.code !== 200){
			$("infovis").text("Error: Read friend information failed");
			return;
		}
		var infovis = document.getElementById('infovis');
		var w = infovis.offsetWidth, h = infovis.offsetHeight;
		console.log(w + " " + h);
		//init Hypertree
		var ht = new $jit.Hypertree({
			//id of the visualization container
			injectInto: 'infovis',
			//canvas width and height
			width: w,
			height: h,
			//Change node and edge styles such as
			//color, width and dimensions.
			Node: {
				//overridable: true,
				'transform': false,
				color: "#f00"
			},
	 
			Edge: {
				//overridable: true,
				color: "#088"
			},
			//calculate nodes offset
			offset: 0.2,
			//Change the animation transition type
			transition: $jit.Trans.Back.easeOut,
			//animation duration (in milliseconds)
			duration:1000,
			//Attach event handlers and add text to the
			//labels. This method is only triggered on label
			//creation

			onCreateLabel: function(domElement, node){
				domElement.innerHTML = node.name;
				domElement.style.cursor = "pointer";
				domElement.onclick = function() {
					 $.get("/ajax/friends",{
					 	user: node.id
					 }, function(resp) {
							ht.op.sum(buildJSONFromList(resp.uname, resp.desc), {
								type: "fade:seq",
								fps: 30,
								duration: 1000,
								hideLabels: false,
								onComplete: function(){
									 console.log("New nodes added!");
								}
							});
					 });
				}
			},
			//Change node styles when labels are placed
			//or moved.
			onPlaceLabel: function(domElement, node){
					 var width = domElement.offsetWidth;
					 var intX = parseInt(domElement.style.left);
					 intX -= width / 2;
					 domElement.style.left = intX + 'px';
			},
			
			onComplete: function(){
			}
		});
		//load JSON data.
		ht.loadJSON(buildJSONFromList(json.uname, json.desc));
		//compute positions and plot.
		ht.refresh();
		ht.controller.onBeforeCompute(ht.graph.getNode(ht.root));
		ht.controller.onAfterCompute();
		ht.controller.onComplete();
	});
});
