var margin = {top: 20, right: 20, bottom: 20, left: 20};
var viewWidth = window.innerWidth - margin.right;
var viewHeight = window.innerHeight - margin.bottom;

var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;

var zoom = d3.zoom()
	 .scaleExtent([1, 20])
	 .on("zoom", zoomed);

var svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height)
	.call(zoom);

//for tooltip 
var offsetL = document.getElementById('map').offsetLeft+10;
var offsetT = document.getElementById('map').offsetTop+10;

var tooltip = d3.select("#map")
	 .append("div")
	 .attr("class", "tooltip hidden");

function drawWorldMap() {
	var viewWidth = window.innerWidth - margin.right;
	var viewHeight = window.innerHeight - margin.bottom;
	
	var width = viewWidth - margin.left - margin.right;
	var height = viewHeight - margin.top - margin.bottom;

	var projection = d3.geoMercator()
		.scale((Math.min(width,height)/500)*100)
		.translate([width/2,height/1.5])
	
	var path = d3.geoPath()
		.projection(projection);
		
	//need this for correct panning
	var g = svg.append("g");

	//get json data and draw it
	d3.json("countries.topo.json", function(error, world) {
	  if(error) return console.error(error);

	  //countries
	  g.attr("class", "boundary")
		.selectAll("boundary")
			.data(topojson.feature(world, world.objects.countries).features).enter()
				.append("path")
				.attr("name", function(d) {return d.properties.name;})
				.attr("id", function(d) { return d.id;})
				.on("click", function(d) {
					console.log("You clicked on country: " + d.id);
				})
				.on("mousemove", showTooltip)
				.on("mouseover", selected)
				.on("mouseout",  function(d,i) {
					tooltip.classed("hidden", true);
				})
				.attr("d", path)
				.attr("style", function(d, i) { return "fill-opacity: " + (i/177) });
	});
}

function showTooltip(d) {
  label = d.properties.name;
  var mouse = d3.mouse(svg.node())
	.map( function(d) { return parseInt(d); } );
  tooltip.classed("hidden", false)
	.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
	.html(label);
}

function selected() {
  d3.select('.selected').classed('selected', false);
  d3.select(this).classed('selected', true);
}


function zoomed() {
	d3.event.transform.x = Math.min(0, Math.max(d3.event.transform.x, width - width * d3.event.transform.k));
	d3.event.transform.y = Math.min(0, Math.max(d3.event.transform.y, height - height * d3.event.transform.k));
	d3.select("g").attr("transform", d3.event.transform);

	//adjust the stroke width based on zoom level
	d3.selectAll(".boundary")
		.style("stroke-width", 1 / d3.event.transform.k);
	
}

function resize() {
	var margin = {top: 20, right: 20, bottom: 20, left: 20};
	var viewWidth = window.innerWidth - margin.right;
	var viewHeight = window.innerHeight - margin.bottom;

	width = viewWidth - margin.left - margin.right;
	height = viewHeight - margin.top - margin.bottom;

	d3.select("svg")
		.attr("width", width)
		.attr("height", height)

	d3.select("g")
		.attr("width", width)
		.attr("height", height)

	d3.select("g").remove();
	drawWorldMap();
}

d3.select(window).on("resize", resize);

drawWorldMap();
