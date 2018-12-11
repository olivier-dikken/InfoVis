// World Map inspired by http://bl.ocks.org/MaciejKus/61e9ff1591355b00c1c1caf31e76a668
// Dual bar chart inspired by https://github.com/liufly/Dual-scale-D3-Bar-Chart and https://bl.ocks.org/mbostock/2368837

Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

var StartYear = 1961;
var EndYear = 2017;
var CurrentYear = EndYear;
var xArray = Array.range(StartYear, EndYear);

var margin = {top: 20, right: 20, bottom: 30, left: 40};
var viewWidth = window.innerWidth / 2 - (margin.right + 1);
var viewHeight = window.innerHeight - (margin.bottom);

var width = viewWidth - margin.left - margin.right;
var height = viewHeight - margin.top - margin.bottom;
var halfHeight = (viewHeight/2 - 1) - margin.top - margin.bottom;

//WorldMap variables
var zoom = d3.zoom()
	 .scaleExtent([1, 20])
	 .translateExtent([[0, 0], [width, height]])
	 .on("zoom", zoomed);
		
//offset for tooltip 
var offsetL = d3.select("#map").node().offsetLeft+10;
var offsetT = d3.select("#map").node().offsetTop+10;

var tooltip = d3.select("#map")
	 .append("div")
	 .attr("class", "tooltip hidden");

var selectedCountries = new Array(null, null);

var svg1 = d3.select("#map").append("svg")
	.attr("id", "svg1")
	.attr("width", viewWidth)
	.attr("height", viewHeight)
	.call(zoom);
	
//Scatterpot variables
var x = d3.scaleLinear()
    .range([0, width]);

//half height
var y1 = d3.scaleLinear()
    .range([halfHeight, 0]);

//half height
var y2 = d3.scaleLinear()
	.range([halfHeight, 0])

var xAxis = d3.axisBottom()
    .scale(x);

var yAxis1 = d3.axisLeft()
    .scale(y1);

var yAxis2 = d3.axisLeft()
	.scale(y2);

d3.select("#comparison").append("svg")
	.attr("id", "svg2")
	.attr("width", viewWidth)
	.attr("height", viewHeight/2-1);	

var svg2 = d3.select("#svg2")
	.append("g")
		.attr("class", "scatterplot")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
//Dual bar chart variables
var xDualBarChart = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.1);

var yDualBarChart = d3.scaleLinear().range([halfHeight, 0]);

var xAxisDBC = d3.axisBottom()
    .scale(xDualBarChart)
	.tickValues(xArray.filter(function(d,i){ return !((i+1)%5)})); // One tick value for each 5 years
	
var yAxisDBC = d3.axisLeft()
	.scale(yDualBarChart)
	.ticks(4);

d3.select("#versus").append("svg")
	.attr("id", "svg3")
	.attr("width", viewWidth)
	.attr("height", viewHeight/2-1);	
	
var svg3 = d3.select("#svg3")
	.append("g")
		.attr("class", "dual bar chart")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
function drawDualBarChart(d1, d2) {
	//console.log("d1: " + d1);
	//console.log("d2: " + d2);
	var data1 = [];
	var data2 = [];
	
	for (var i = 0; i < d1.length; i++) {
		if(!isNaN(d1[i])){
			var item = {"gdpGrowth": d1[i], "year": xArray[i]};
			data1.push(item);
		}
		if(!isNaN(d2[i])){
			var item = {"gdpGrowth": d2[i], "year": xArray[i]};
			data2.push(item);
		}
	}

	//var xExtent = d3.extent(xArray, function(d) { return d; });
	var xExtent = xArray.map(function(d) { return d; });
	//var yExtent = d3.extent(d1, function(d) { return d; });//TODO check if should use all data or only of 1 country
	var yExtent = d3.extent(d1.concat(d2), function(d) { return d; });

	//xDualBarChart.domain(xExtent).nice(); // gives an error
	xDualBarChart.domain(xExtent);
	yDualBarChart.domain(yExtent).nice();
	
	svg3.selectAll("g").remove();
	svg3.selectAll(".bar1").remove();
	svg3.selectAll(".bar2").remove();
	
	svg3.append("g")
		.attr("class", "x axis")
		//.attr("transform", "translate(0," + halfHeight + ")")
		.attr("transform", "translate(0," + yDualBarChart(0) + ")")
		.call(xAxisDBC);
	svg3.append("g")
		.attr("class", "y axis axisLeft")
		.attr("transform", "translate(0,0)")
		.call(yAxisDBC)
	.append("text")
		.attr("y", 6)
		.attr("dy", "-2em")
		.style("text-anchor", "end")
		.style("text-anchor", "end")
		.text("GDP growth");
		
	bars1 = svg3.selectAll(".bar1").data(data1).enter();
	bars2 = svg3.selectAll(".bar2").data(data2).enter();
	
	bars1.append("rect")
		.attr("class", "bar1")
		.attr("x", function(d) { return xDualBarChart(d.year); })
		.attr("width", xDualBarChart.bandwidth()/2)
		//.attr("y", function(d) { return yDualBarChart(d.gdpGrowth); })
		//.attr("height", function(d,i,j) { return halfHeight - yDualBarChart(d.gdpGrowth); })
		.attr("y", function(d) { return yDualBarChart(Math.max(0,d.gdpGrowth)); })
		.attr("height", function(d,i,j) { return Math.abs(yDualBarChart(d.gdpGrowth) - yDualBarChart(0)); })
		.attr("year", function(d) { return d.year; })
		.on("click", function(d) { setYear(d.year) })
		.on("mouseout",  barMouseOut)
		.on("mouseover", barHovered); 
		
	bars2.append("rect")
		.attr("class", "bar2")
		.attr("x", function(d) { return xDualBarChart(d.year) + xDualBarChart.bandwidth()/2; })
		.attr("width", xDualBarChart.bandwidth()/2)
		.attr("y", function(d) { return yDualBarChart(Math.max(0,d.gdpGrowth)); })
		.attr("height", function(d,i,j) { return Math.abs(yDualBarChart(d.gdpGrowth) - yDualBarChart(0)); })
		.attr("year", function(d) { return d.year; })
		.on("click", function(d) { setYear(d.year) })
		.on("mouseout",  barMouseOut)
		.on("mouseover", barHovered); 		
}

function drawScatterplot(d1, d2) {
	var data1 = [];
	var data2 = [];
	
	for (var i = 0; i < d1.length; i++) {
		if(!isNaN(d1[i])){
			var item = {"gdpGrowth": d1[i], "year": xArray[i]};
			data1.push(item);
		}
		if(!isNaN(d2[i])){
			var item = {"gdpGrowth": d2[i], "year": xArray[i]};
			data2.push(item);
		}
	}

	var xExtent = d3.extent(xArray, function(d) { return d; });
	//var yExtent = d3.extent(d1, function(d) { return d; });//TODO check if should use all data or only of 1 country
	var yExtent = d3.extent(d1.concat(d2), function(d) { return d; });

	x.domain(xExtent).nice();
	y1.domain(yExtent).nice();

	//half height
	y2.domain(yExtent).nice();

	svg2.selectAll("g").remove();

	svg2.append("g")
		.attr("id", "xAxis")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + halfHeight + ")")
		.call(xAxis)
	.append("text")
		.attr("class", "label")
		.attr("id", "xLabel")
		.attr("x", width)
		.attr("y", -6)
		.style("text-anchor", "end")
		.text("gdpGrowth");

	svg2.append("g")
		.attr("id", "yAxis")
		.attr("class", "y axis")
		.call(yAxis2)
	.append("text")
		.attr("class", "label")
		.attr("id", "yLabel")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("y");

	var points1 = svg2.append("g")
		.attr("class", "plotArea")
	.selectAll(".dot")
		.data(data1)
    .enter().append("circle")
		.attr("class", "dot")
		.attr("class", "dotscountry1")
		.attr("r", 3.5)
		.attr("cx", function(d) { return x(d.year); })
		.attr("cy", function(d) { return y2(d.gdpGrowth); })
		//.attr("cy", function(d) { return y(d["gdpGrowth1"]); })

	var points2 = svg2.append("g")
		.attr("class", "plotArea")
    .selectAll(".dot")
		.data(data2)
    .enter().append("circle")
		.attr("class", "dot")
		.attr("class", "dotscountry2")
		.attr("r", 3.5)
		.attr("cx", function(d) { return x(d.year); })
		.attr("cy", function(d) { return y2(d.gdpGrowth); })

}

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
	var country1 = 0;
	var country2 = 0;
	data.forEach(function(element, i){
		if(element.country_code === c1){
			console.log(element);
			//compare.push(element);
			country1 = i;
		} else if (element.country_code === c2){
			console.log(element);
			//compare.push(element);
			country2 = i;
		}
	})
	//console.log(data[country1].gdpGrowth);
	drawScatterplot(data[country1].gdpGrowth, data[country2].gdpGrowth);
	drawDualBarChart(data[country1].gdpGrowth, data[country2].gdpGrowth);

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

function setYear(y) {
 	console.log("Selected year is set to: " + y);
	CurrentYear = y;
}

function barHovered() {
	d3.select(this).classed('barhovered', true);
}

function barMouseOut() {
	//unhover
 	d3.select(this).classed('barhovered', false);
}

function resize() {
	var margin = {top: 20, right: 20, bottom: 20, left: 20};
	var viewWidth = window.innerWidth / 2 - margin.right;
	var viewHeight = window.innerHeight - margin.bottom;

	d3.select("#svg1")
		.attr("width", viewWidth)
		.attr("height", viewHeight)
	
	d3.select("#svg2")
		.attr("width", viewWidth)
		.attr("height", viewHeight/2-1)
		
	d3.select("#svg3")
		.attr("width", viewWidth)
		.attr("height", viewHeight/2-1)
		
	d3.select("g")
		.attr("width", viewWidth)
		.attr("height", viewHeight)

	d3.select("g").remove();
	
	drawWorldMap();
	
	width = viewWidth - margin.left - margin.right;
	height = viewHeight - margin.top - margin.bottom;
	halfHeight = (viewHeight/2 - 1) - margin.top - margin.bottom;
	
	//Scatterplot axes
	x.range([0, width]);
	y1.range([halfHeight, 0]);
	y2.range([halfHeight, 0]);
	
	xAxis.scale(x);
	yAxis1.scale(y1);
	yAxis2.scale(y2);
	
	//Dual bar chart axes
	xDualBarChart.rangeRound([0, width]);
	yDualBarChart.range([halfHeight, 0]);
	
	xAxisDBC.scale(xDualBarChart);
	yAxisDBC.scale(yDualBarChart);
	
	if (selectedCountries[1] !== null) {
		getCountryData(selectedCountries[0].id, selectedCountries[1].id);
	}
}

d3.select(window).on("resize", resize);

drawWorldMap();
