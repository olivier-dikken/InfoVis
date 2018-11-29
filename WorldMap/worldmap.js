var margin = {top: 20, right: 20, bottom: 20, left: 20};
var viewWidth = window.innerWidth / 2 - margin.right;
var viewHeight = window.innerHeight - margin.bottom;

var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;

var zoom = d3.zoom()
	 .scaleExtent([1, 20])
	 .translateExtent([[0, 0], [width, height]])
	 .on("zoom", zoomed);

var svg1 = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height)
	.attr("class","map")
	.call(zoom);
	
var svg2 = d3.select("#comparison").append("svg")
	.attr("width", width)
	.attr("height", height)
	.attr("class","comparison");

//for tooltip 
var offsetL = document.getElementById('map').offsetLeft+10;
var offsetT = document.getElementById('map').offsetTop+10;

var tooltip = d3.select("#map")
	 .append("div")
	 .attr("class", "tooltip hidden");

var selectedCountries = new Array(null, null);

var countryStyle = function(d, i) { return "fill-opacity: " + (i/177) };

function drawWorldMap() {
	var viewWidth = window.innerWidth / 2 - margin.right;
	var viewHeight = window.innerHeight - margin.bottom;
	
	var width = viewWidth - margin.left - margin.right;
	var height = viewHeight - margin.top - margin.bottom;

	var projection = d3.geoMercator()
		.scale((Math.min(width,height)/500)*100)
		.translate([width/2,height/1.5])
	
	var path = d3.geoPath()
		.projection(projection);
		
	//need this for correct panning
	var g = svg1.append("g");

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
				.on("click", clicked)
				.on("mousemove", showTooltip)
				.on("mouseover", hovered)
				.on("mouseout",  mouseOut)
				.attr("d", path)
				.attr("style",  countryStyle);
	});
}

function showTooltip(d) {
  label = d.properties.name;
  var mouse = d3.mouse(svg1.node())
	.map( function(d) { return parseInt(d); } );
  tooltip.classed("hidden", false)
	.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
	.html(label);
}

function mouseOut() {
	//hide tooltip
	tooltip.classed("hidden", true);
	//unhover
 	d3.select('.hovered').classed('hovered', false);
}

function clicked(){
 	//unhover
 	d3.select('.hovered').classed('hovered', false);

 	//handle click
 	setSelected(this);
}

//max 2 selected
function setSelected(element){
	if(selectedCountries[0] === element || selectedCountries[1] === element){
		return;
	}
	//select the selection
	if(selectedCountries[0] === null){
		selectedCountries[0] = element;
	} else {
		if(selectedCountries[1] !== null){ //unselect 3rd country
			d3.select(selectedCountries[1]).attr('class', '');
		}
		selectedCountries[1] = selectedCountries[0];
		selectedCountries[0] = element;
	}
	//put class selected on selection
	selectedCountries.forEach(function(elem){
		if(elem === null){
		} else {
			d3.select(elem).attr('class', 'selected');
		}
	})
}

function hovered(){
	if(d3.select(this).classed('selected')){
		return;
	} 
	d3.select('.hovered').classed('hovered', false);
	d3.select(this).classed('hovered', true);
}



function zoomed() {
	d3.select("g").attr("transform", d3.event.transform);

	//adjust the stroke width based on zoom level
	d3.select("g").style("stroke-width", 1 / d3.event.transform.k);
	
}

function resize() {
	var margin = {top: 20, right: 20, bottom: 20, left: 20};
	var viewWidth = window.innerWidth / 2 - margin.right;
	var viewHeight = window.innerHeight - margin.bottom;

	width = viewWidth - margin.left - margin.right;
	height = viewHeight - margin.top - margin.bottom;

	d3.selectAll("svg")
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
