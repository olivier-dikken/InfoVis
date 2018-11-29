Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

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

var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

var colors = ["blue", "red"];
var color = d3.scaleLinear()
    .range(colors);

var xAxis = d3.axisBottom()
    .scale(x);

var yAxis = d3.axisLeft()
    .scale(y);

var xValue = "x";
var yValue = "y";
var colorValue = "a";

var svg2 = d3.select("svg2")
    .attr("width", viewWidth)
    .attr("height", viewHeight)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var defs = svg2.append( "defs" );

var legendGradient = defs.append( "linearGradient" )
    .attr( "id", "legendGradient" )
    .attr( "x1", "0" )
    .attr( "x2", "0" )
    .attr( "y1", "1" )
    .attr( "y2", "0" );

legendGradient.append( "stop" )
    .attr( "id", "gradientStart" )
    .attr( "offset", "0%" )
    .style( "stop-opacity", 1);

legendGradient.append( "stop" )
    .attr( "id", "gradientStop" )
    .attr( "offset", "100%" )
    .style( "stop-opacity", 1);

var points;

function drawScatterplot(d1, d2) {

	data = [];
	data.push(d1);
	data.push(d2);
	console.log("d1: " + d1);
	console.log("d2: " + d2);
	console.log("data: " + data);

	var xArray = Array.range(1961, 2017);

  var xExtent = d3.extent(xArray, function(d) { return d; });
  var yExtent = d3.extent(data, function(d) { return d["gdpGrowth"]; });

  x.domain(xExtent).nice();
  y.domain(yExtent).nice();

  svg2.selectAll("g").remove();

  svg2.append("g")
      .attr("id", "xAxis")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("id", "xLabel")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("x");

  svg2.append("g")
      .attr("id", "yAxis")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("id", "yLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("y");

  points = svg2.append("g")
      .attr("class", "plotArea")
    .selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(Array.range(1961, 2017)); })
      .attr("cy", function(d) { return y(d["gdpGrowth"]); })

  svg2.select("#gradientStart")
    .style("stop-color", colors[0]);
  svg2.select("#gradientStop")
    .style("stop-color", colors[1]);

  var legend = svg2.append("g")
      .attr("class", "legend");

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 72)
      .style("fill", "url(#legendGradient)");

  legend.append("text")
      .attr("x", width - 22)
      .attr("y", 6)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text("high");

  legend.append("text")
      .attr("x", width - 22)
      .attr("y", 66)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text("low");

}

var StartYear = 1961;
var EndYear = 2017


function getCountryData(c1, c2){
	d3.csv("resources/c5fe9392-8421-43cc-b646-6b2d7879c3d8_Data.csv", function(d) {
	var growthArray = [];
	for(i = StartYear; i < EndYear; i ++){
		growthArray.push(+d[i + " [YR" + i + "]"]);
	}
  return {
  	country_code : d["Country Code"],
  	country_name: d["Country Name"],
  	series_name: d["Series Name"],
  	series_code: d["Series Code"],
  	gdpGrowth : growthArray
  };
}, function(data){
	var compare = [];
	data.forEach(function(element){
		if(element.country_code === c1 || element.country_code === c2){
			console.log(element);
			compare.push(element);
		}
	})
	drawScatterplot(compare[0], compare[1]);

});
}


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
		getCountryData(selectedCountries[0].id, selectedCountries[1].id);
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
