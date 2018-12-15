// World Map inspired by http://bl.ocks.org/MaciejKus/61e9ff1591355b00c1c1caf31e76a668
// Dual bar chart inspired by https://github.com/liufly/Dual-scale-D3-Bar-Chart and https://bl.ocks.org/mbostock/2368837

Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

//init options
var indicator_primary = "";
var indicator_secondary = "";
var indicatorList = ["Refugees_Total", "GDP growth (annual %)", "GDP per capita (current US$)", "Population density (people per sq. km of land area)", "Population growth (annual %)"];
var multiplyInicatorList = ["Population density (people per sq. km of land area)"];
var selectPrimary;
var selectSecondary;
var selectedCountries = [null, null];
var doNorm = false;
document.getElementById("ToggleCheckbox").checked = doNorm;

//init config
var StartYear = 1951;
var EndYear = 2018;
var xArray = Array.range(StartYear, EndYear);

// Slider init
var slider = document.getElementById("year_slider");
var output = document.getElementById("year_value");
var selected_year = Number(slider.value)
output.innerHTML = slider.value; // Display the default slider value

//view settings
//TopPanel height is hardcoded in css to 80px
var TopPanelHeight = 60;
var margin = {top: TopPanelHeight, right: 20, bottom: 20, left: 20};
var svgMargin = {top: 30, right: 30, bottom: 50, left: 70};
var viewWidth = window.innerWidth - (margin.right + margin.left);
var viewHeight = window.innerHeight - (margin.bottom + margin.top);

var halfWidth = viewWidth/2 - 1;
var halfHeight = viewHeight/2 - 1;

var svgInnerHalfWidth = halfWidth - (svgMargin.left + svgMargin.right);
var svgInnerFullHeight = viewHeight - (svgMargin.top + svgMargin.bottom);
var svgInnerHalfHeight = halfHeight - (svgMargin.top + svgMargin.bottom);

//WorldMap variables
var zoom = d3.zoom()
	 .scaleExtent([1, 20])
	 .translateExtent([[0, 0], [svgInnerHalfWidth, svgInnerFullHeight]])
	 .on("zoom", zoomed);
//init global zoom variables
var zoomk = 1;
		
//offset for tooltip 
var offsetL = d3.select("#map").node().offsetLeft+10;
var offsetT = d3.select("#map").node().offsetTop+10;

var tooltip = d3.select("#map")
	 .append("div")
	 .attr("class", "tooltip hidden");

var svgMap = d3.select("#map").append("svg")
	.attr("id", "svgMap")
	.attr("width", halfWidth)
	.attr("height", viewHeight)
	.call(zoom);
	
//Scatterpot variables
var x = d3.scaleLinear()
    .range([0, svgInnerHalfWidth]);

//half height
var y = d3.scaleLinear()
    .range([svgInnerHalfHeight, 0]);

var xAxis = d3.axisBottom()
    .scale(x);

var yAxis = d3.axisLeft()
    .scale(y);

d3.select("#comparison").append("svg")
	.attr("id", "svgScatter")
	.attr("width", halfWidth)
	.attr("height", halfHeight);	

var svgScatter = d3.select("#svgScatter")
	.append("g")
		.attr("class", "scatterplot")
		.attr("transform", "translate(" + svgMargin.left + "," + svgMargin.top + ")");
		
//Dual bar chart variables
var xDualBarChart = d3.scaleBand()
    .rangeRound([0, svgInnerHalfWidth])
    .padding(0.1);

var yDualBarChart = d3.scaleLinear().range([svgInnerHalfHeight, 0]);

var xAxisDBC = d3.axisBottom()
    .scale(xDualBarChart)
	.tickValues(xArray.filter(function(d,i){ return !((i+1)%5)})); // One tick value for each 5 years
	
var yAxisDBC = d3.axisLeft()
	.scale(yDualBarChart)
	.ticks(6);

d3.select("#versus").append("svg")
	.attr("id", "svgComparison")
	.attr("width", halfWidth)
	.attr("height", halfHeight);	
	
var svgComparison = d3.select("#svgComparison")
	.append("g")
		.attr("class", "dual bar chart")
		.attr("transform", "translate(" + svgMargin.left + "," + svgMargin.top + ")");


//set default country coloring
var countryStyle = function(d, i) { return "fill-opacity: " + (1) };

//set min/max values for refugees indicator to determine scale
//TODO get distribution to change scale to non-linear (i.e. log)
var minValue = Number.MAX_VALUE
var maxValue = Number.MIN_VALUE

var countryData; // store data.json
var worldData; // store countries.topo.json

d3.json("resources/data.json", function(error, data){
	if(error) return console.error(error);	
	countryData = data;
	console.log(data)
	for (var keyCountry in data){
		var regex = "Refugees_Total";
		for(var indicator in data[keyCountry]){
			if(indicator.match(regex)){
				// 66 is year 20
				year = 66;
				value = data[keyCountry][indicator][year];
				if(value === null) continue;
				if(value < minValue){
					minValue = value;
				}
				if(value > maxValue){
					maxValue = value;
				}
			}				
		}		
	}
});

d3.json("countries.topo.json", function(error, world) {
	if(error) return console.error(error);
	worldData = world;
	//console.log(worldData);
});

function updatePrimaryIndicator(){
	newIndicatorName = selectPrimary.options[selectPrimary.selectedIndex].value;
	if(newIndicatorName == indicator_primary){
		console.log("This indicator is already set as primary indicator.");
		return;
	} else if(newIndicatorName == indicator_secondary){
		console.log("Cannot select same indicator as secondary indicator.");
		return;
	}
	//if newindicator exists display in html and set indicator_primary
	if(indicatorList.includes(newIndicatorName)){
		indicator_primary = newIndicatorName;
		updateToggle();
		for(i = 0; i < selectSecondary.options.length; i++){
			var element = selectSecondary.options[i].value;
			if(element == indicator_primary){
				selectSecondary.options[i].disabled = true;
			} else {
				selectSecondary.options[i].disabled = false;
			}
		}
		if(selectedCountries[1] != null) {
			visualizeData(selectedCountries[0].id, selectedCountries[1].id);
		}
		drawScatterplot();
	}
}


function updateSecondaryIndicator(){
	newIndicatorName = selectSecondary.options[selectSecondary.selectedIndex].value;
	if(newIndicatorName == indicator_secondary){
		console.log("This indicator is already set as secondary indicator.");
		return;
	} else if(newIndicatorName == indicator_primary){
		console.log("Cannot select same indicator as primary indicator.");
		return; 
	}
	//if newindicator exists display in html and set indicator_secondary
	if(indicatorList.includes(newIndicatorName)){
		indicator_secondary = newIndicatorName;
		updateToggle();
		for(i = 0; i < selectPrimary.options.length; i++){
			var element = selectPrimary.options[i].value;
			if(element == indicator_secondary){
				selectPrimary.options[i].disabled = true;
			} else {
				selectPrimary.options[i].disabled = false;
			}
		}
		if(selectedCountries[1] != null) {
			visualizeData(selectedCountries[0].id, selectedCountries[1].id);
		}
		drawScatterplot();
	}
}
		
function drawDualBarChart(dp1, dp2, ds1, ds2) {
	//console.log("d1: " + d1);
	//console.log("d2: " + d2);
	var data1 = [];
	var data2 = [];

	var d1 = new Array(dp1.length);
	var d2 = new Array(dp2.length);
	
	for (var i = 0; i < d1.length; i++) {
		if(!isNaN(dp1[i]) && dp1[i] != null && (!doNorm || (!isNaN(ds1[i]) && ds1[i] != null) ) ){
			var item = {"pval": dp1[i], "sval": ds1[i], "year": xArray[i]};
			if(!doNorm){
				item.computed = item.pval;
			} else {
				if(multiplyInicatorList.includes(indicator_secondary)){
					item.computed =  item.pval * item.sval;
				} else {
					item.computed =  item.pval / item.sval;
				}
			}
			data1.push(item);
		} 
		if(!isNaN(dp2[i]) && dp2[i] != null && (!doNorm || (!isNaN(ds2[i]) && ds2[i] != null) ) ){
			var item = {"pval": dp2[i], "sval": ds2[i], "year": xArray[i]};
			if(!doNorm){
				item.computed = item.pval;
			} else {
				if(multiplyInicatorList.includes(indicator_secondary)){
					item.computed =  item.pval * item.sval;
				} else {
					item.computed =  item.pval / item.sval;
				}
			}
			data2.push(item);
		} 
	}

	//var xExtent = d3.extent(xArray, function(d) { return d; });
	var xExtent = xArray.map(function(d) { return d; });
	//var yExtent = d3.extent(d1, function(d) { return d; });
	var yExtent = d3.extent(data1.concat(data2).concat({"computed": 0}), function(d) { return d.computed; });

	//xDualBarChart.domain(xExtent).nice(); // gives an error
	xDualBarChart.domain(xExtent);
	yDualBarChart.domain(yExtent).nice();
	
	svgComparison.selectAll("g").remove();
	svgComparison.selectAll("text").remove();
	
	svgComparison.append("g")
		.attr("class", "x axis")
		//.attr("transform", "translate(0," + halfHeight + ")")
		.attr("transform", "translate(0," + yDualBarChart(0) + ")")
		.call(xAxisDBC);
	svgComparison.append("text")
		.attr("class", "label")
		.attr("id", "xLabel")
		.attr("transform", "translate(" + (svgInnerHalfWidth/2) + " ," + (svgInnerHalfHeight + svgMargin.top + 10) + ")")
		.style("text-anchor", "start")
		.text("Year");
		
	svgComparison.append("g")
		.attr("class", "y axis axisLeft")
		.call(yAxisDBC);
	svgComparison.append("text")
		.attr("class", "label")
		.attr("id", "yLabel")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - svgMargin.left)
		.attr("dy", "1em")
		.style("text-anchor", "end")
		.text(indicator_primary);
		
	svgComparison.append("g")
		.attr("class", "bars1")
	.selectAll(".bar1")
		.data(data1)
	.enter().append("rect")
		.attr("class", "bar1")
		.attr("x", function(d) { return xDualBarChart(d.year); })
		.attr("width", xDualBarChart.bandwidth()/2)
		//.attr("y", function(d) { return yDualBarChart(d.gdpGrowth); })
		//.attr("height", function(d,i,j) { return halfHeight - yDualBarChart(d.gdpGrowth); })
		.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
		.attr("height", function(d,i,j) { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
		.attr("year", function(d) { return d.year; })
		.on("click", function(d) { setYear(d.year) })
		.on("mouseout",  barMouseOut)
		.on("mouseover", barHovered); 
		
	svgComparison.append("g")
		.attr("class", "bars2")
	.selectAll(".bar2")
		.data(data2)
	.enter().append("rect")
		.attr("class", "bar2")
		.attr("x", function(d) { return xDualBarChart(d.year) + xDualBarChart.bandwidth()/2; })
		.attr("width", xDualBarChart.bandwidth()/2)
		.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
		.attr("height", function(d,i,j)  { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
		.attr("year", function(d) { return d.year; })
		.on("click", function(d) { setYear(d.year) })
		.on("mouseout",  barMouseOut)
		.on("mouseover", barHovered); 	
}

function drawScatterplot() {
	
	var d1 = {}; // primary indicators
	var d2 = {}; // secondary indicators
	var data = [];

	Object.keys(countryData).map(function(c) { 
		if (countryData[c][indicator_primary] != undefined) {
			d1[c] = countryData[c][indicator_primary][selected_year - StartYear]
		}
		if (countryData[c][indicator_secondary] != undefined) {
			d2[c] = countryData[c][indicator_secondary][selected_year - StartYear]
		}
	});

	Object.keys(d1).map(function(c) { 
		if(!isNaN(d1[c]) && d1[c] != null && !isNaN(d2[c]) && d2[c] != null) {
			var item = {indicator_primary: d1[c], indicator_secondary: d2[c], ISO_code: c};
			data.push(item);
		}
	});
	
	var xExtent = d3.extent(Object.values(d1), function(d) { return d; });
	//var yExtent = d3.extent(d1, function(d) { return d; });//TODO check if should use all data or only of 1 country
	var yExtent = d3.extent(Object.values(d2), function(d) { return d; });

	x.domain(xExtent).nice();
	y.domain(yExtent).nice();

	svgScatter.selectAll("g").remove();
	svgScatter.selectAll("text").remove();
	
	svgScatter.append("g")
		.attr("id", "xAxis")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + svgInnerHalfHeight + ")")
		.call(xAxis);
		
	svgScatter.append("text")
		.attr("class", "label")
		.attr("id", "xLabel")
		.attr("transform", "translate(" + (svgInnerHalfWidth/2) + " ," + (svgInnerHalfHeight + svgMargin.top + 10) + ")")
		.style("text-anchor", "start")
		.text(indicator_primary);

	svgScatter.append("g")
		.attr("id", "yAxis")
		.attr("class", "y axis")
		.call(yAxis);
		
	svgScatter.append("text")
		.attr("class", "label")
		.attr("id", "yLabel")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - svgMargin.left)
		.attr("dy", "1em")
		.style("text-anchor", "end")
		.text(indicator_secondary);

	var points = svgScatter.append("g")
		.attr("class", "plotArea")
	.selectAll(".dot")
		.data(data)
    .enter().append("circle")
		.attr("r", dotRadius)
		.attr("cx", function(d) { return x(d.indicator_primary); })
		.attr("cy", function(d) { return y(d.indicator_secondary); })
		.attr("countryCode", function(d) { return d.ISO_code; })
		.attr("class", colorDots)
		.on("mousemove", showDotTooltip)
		.on("mouseover", dotHovered)
		.on("mouseout",  dotMouseOut);
		//.attr("cy", function(d) { return y(d["gdpGrowth1"]); })
		
	// move selected countrydots to front	
	d3.select(".dotscountry1").moveToFront();
	d3.select(".dotscountry2").moveToFront();
}

function visualizeData(c1, c2){
	var TimeLength = EndYear - StartYear;

	var data_1 				= new Array(TimeLength);
	var data_1_secondary 	= new Array(TimeLength);
	var data_2 				= new Array(TimeLength);
	var data_2_secondary 	= new Array(TimeLength);
	var hasData_1 			= false;
	var hasData_1_secondary = false;
	var hasData_2 			= false;
	var hasData_2_secondary = false;

	if(typeof countryData[c1] === 'undefined'){
		data_1.fill(null, 0, TimeLength);
		data_1_secondary.fill(null, 0, TimeLength);
	} else {
		data_1 = countryData[c1][indicator_primary];
		data_1_secondary = countryData[c1][indicator_secondary];
		hasData_1 = true;
	}

	if(typeof countryData[c2] === 'undefined'){
		data_2.fill(null, 0, TimeLength);
		data_2_secondary.fill(null, 0, TimeLength);
	} else {
		data_2 = countryData[c2][indicator_primary];
		data_2_secondary = countryData[c2][indicator_secondary];
		hasData_2 = true;
	}
	
	if(hasData_1 || hasData_2){
		drawDualBarChart(data_1, data_2, data_1_secondary, data_2_secondary);
	} else {
		//notify user no data
		alert('No Data for selection.');
	}
}


function drawWorldMap() {
	var projection = d3.geoMercator()
		.scale((Math.min(halfWidth,viewHeight)/500)*100)
		.translate([halfWidth/2,viewHeight/1.5])
	
	var path = d3.geoPath()
		.projection(projection);
		
	//need this for correct panning
	var g = svgMap.append("g");

	// Use worldData to draw all countries
	g.attr("class", "boundary").selectAll("boundary")
		.data(topojson.feature(worldData, worldData.objects.countries).features).enter()
			.append("path")
			.attr("name", function(d) {return d.properties.name;})
			.attr("id", function(d) { return d.id;})
			.on("click", clicked)
			.on("mousemove", showTooltip)
			.on("mouseover", hovered)
			.on("mouseout",  mouseOut)
			.attr("d", path)
			.attr("style",  countryStyle)
			.style("fill", colorScale);	
				
	var rangeColors = ["#adfcad", "#ffcb40", "#ffba00", "#ff7d73", "#ff4e40", "#ff1300"]
	var intervals = []
 
	for(var i = 0; i < 6; i++){
		var limit = (500000) * i;
		intervals.push(limit);
	}
	// Adding legend to map
	var legend = g.selectAll("g.legend")
		.data(intervals)
		.enter().append("g")
		.attr("class", "legend");

  
	var legend_labels = ["< 50", "50+", "150+", "350+", "750+", "> 1500"]
	var colorsFunction = d3.scaleQuantile().domain([minValue, maxValue]).range(rangeColors);	
	var ls_w = 20, ls_h = 20; var height = 200;
	legend.append("rect")
		.attr("x", 20)
		.attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
		.attr("width", ls_w)
		.attr("height", ls_h)
		.style("fill", function(d, i) { return colorsFunction(d); })
		.style("opacity", 0.8);

	legend.append("text")
		.attr("x", 50)
		.attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
		.text(function(d, i){ return intervals[i]; });
}

function colorScale(d){	
	if (d != null) {
		var countryCode = d.id
		var rangeColors = ["#adfcad", "#ffcb40", "#ffba00", "#ff7d73", "#ff4e40", "#ff1300"]
		var colors = d3.scaleQuantile().domain([minValue, maxValue]).range(rangeColors);			
		if(countryData[countryCode]){
			if(countryData[countryCode]["Refugees_Total"]){
				value = countryData[countryCode]["Refugees_Total"][yearToIndex(selected_year)];
				return colors(value);
			}
			else{
				return "grey"
			}
			
		}
		else{
			return "black"
		}
	}
}
	
function colorDots(d) { 
	if (selectedCountries[0] == null) {
		return "dot";
	} else if (d.ISO_code == selectedCountries[0].id) {
		return "dot dotscountry1";
	} else if (selectedCountries[1] == null) {
		return "";
	} else if (d.ISO_code == selectedCountries[1].id) {
		return "dot dotscountry2";
	} else {
		return "dot";
	}
}

function dotRadius(d) { 
	if (selectedCountries[0] == null || selectedCountries[1] == null) {
		return 3.5;
	} else if (d.ISO_code == selectedCountries[0].id || d.ISO_code == selectedCountries[1].id) {
		return 7;
	} else {
		return 3.5;
	}
}
		
function showDotTooltip(d) {
	country = document.getElementById(d.ISO_code);
	label = d.ISO_code;
	
	if (country != null) {
		// color border of country of the dot
		country.classList.add('countrydothovered');
		country.setAttribute("stroke-width", 5/zoomk + "px");
		
		// label for tooltop
		label = country.getAttribute("name");
	}
	// add tooltip
	var mouse = d3.mouse(svgScatter.node())
		.map(function(d) { return parseInt(d); } );
	tooltip.classed("hidden", false)
		.attr("style", "left:"+(mouse[0]+halfWidth+svgMargin.left+margin.left+offsetL)+"px;top:"+(mouse[1]+halfHeight+svgMargin.top+offsetT)+"px")
		.html(label);
}

function dotMouseOut(d) {
	//hide tooltip
	tooltip.classed("hidden", true);
	//unhover
 	d3.select('.countrydothovered').classed('countrydothovered', false);
	d3.select('.dothovered').classed('dothovered', false);
	// uncolor country border
	country = document.getElementById(d.ISO_code);
	if (country != null) {
		country.classList.remove('countrydothovered');
		if(country.id != selectedCountries[0].id && country.id != selectedCountries[1].id) { 
			country.setAttribute("stroke-width", 1/zoomk + "px");
		}
	}
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function dotHovered(){
	d3.select('.dothovered').classed('dothovered', false);
	d3.select(this).classed('dothovered', true);
	// move dot to front
	d3.select(this).moveToFront();
}

function showTooltip(d) {
  label = d.properties.name;
  var mouse = d3.mouse(svgMap.node())
	.map(function(d) { return parseInt(d); } );
  tooltip.classed("hidden", false)
	.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
	.html(label);
}

function mouseOut() {
	//hide tooltip
	tooltip.classed("hidden", true);
	//unhover
 	d3.select('.hovered').classed('hovered', false);
	if (this.id != -99) {
		// unhighlight dot in scatterplot
		d3.select("[countryCode=" + this.id + "]").classed('dothovered', false);
		if(!(d3.select(this).classed('selected_1') || d3.select(this).classed('selected_2'))){
			d3.select("[countryCode=" + this.id + "]").attr('r', 3.5);
		} 
	}
}

function clicked(){
 	//unhover
 	d3.select('.hovered').classed('hovered', false);	
 	//handle click
 	setSelected(this);
}

//unselect countries and remove selected country styles
function resetCountrySelection(){
	selectedCountries.forEach(function(elem){
		if(elem === null){
		} else {
			d3.select(elem).classed('selected_1', false);
			d3.select(elem).classed('selected_2', false);
			d3.select(elem).attr("stroke-width", 1/zoomk + "px");
		}
	})
	selectedCountries = [null, null];
	drawScatterplot();
	svgComparison.selectAll("g").remove();
}

//behaviour: replace 2nd selection
function setSelected(element){
	if(selectedCountries[0] === element || selectedCountries[1] === element){
		return;
	}
	if(selectedCountries[0] === null){//if no countries selected set 1st selection
		selectedCountries[0] = element;
		document.getElementById("SelectedCountry_1").innerHTML = selectedCountries[0].__data__.properties.name;
		// console.log("selectedCountries[0]");
		// console.log(selectedCountries[0]);
		d3.select(selectedCountries[0]).classed('selected_1', true);
		d3.select(selectedCountries[0]).attr("stroke-width", 5/zoomk + "px");
		if (selectedCountries[0].id != -99) {
			// highlight dot country1 in scatterplot
			d3.select("[countryCode=" + selectedCountries[0].id + "]").classed('dotscountry1', true);
			d3.select("[countryCode=" + selectedCountries[0].id + "]").attr('r', 7);
		}
	} else {//if 1st country selected set 2nd selection
		if(selectedCountries[1] !== null){ //if 2nd country selected then unselect and remove class
			d3.select(selectedCountries[1]).classed('selected_2', false);
			d3.select(selectedCountries[1]).attr("stroke-width", 1/zoomk + "px");
			if (selectedCountries[1].id != -99) {
				// unhighlight country2 in scatterplot
				d3.select("[countryCode=" + selectedCountries[1].id + "]").classed('dotscountry2', false);
				d3.select("[countryCode=" + selectedCountries[1].id + "]").attr('r', 3.5);
			}
		}
		selectedCountries[1] = element;
		document.getElementById("SelectedCountry_2").innerHTML = selectedCountries[1].__data__.properties.name;
		d3.select(selectedCountries[1]).classed('selected_2', true);
		d3.select(selectedCountries[1]).attr("stroke-width", 5/zoomk + "px");
		visualizeData(selectedCountries[0].id, selectedCountries[1].id);
		if (selectedCountries[1].id != -99) {
			// highlight dot country2 in scatterplot
			d3.select("[countryCode=" + selectedCountries[1].id + "]").classed('dotscountry2', true);
			d3.select("[countryCode=" + selectedCountries[1].id + "]").attr('r', 7);
		}
	}
}

function hovered(){
	if(d3.select(this).classed('selected')){
		return;
	} 
	// highlight corresponding dot in scatterplot
	if (this.id != -99) {
		d3.select("[countryCode=" + this.id + "]").classed('dothovered', true);
		d3.select("[countryCode=" + this.id + "]").attr('r', 7);
		// move country dot to front
		d3.select("[countryCode=" + this.id + "]").moveToFront();
	}
	// highlight country in worldmap
	d3.select('.hovered').classed('hovered', false);
	d3.select(this).classed('hovered', true);
}

function zoomed() {
	zoomk = d3.event.transform.k;

	d3.select("g").attr("transform", d3.event.transform);

	//adjust the stroke width based on zoom level
	d3.selectAll("path").attr("stroke-width", 1 / zoomk);

	//put class selected on selection
	selectedCountries.forEach(function(elem){
		if(elem === null){
		} else {
			d3.select(elem).attr("stroke-width", 5/zoomk + "px");
		}
	})
}

function setYear(y) {
 	// console.log("Selected year is set to: " + y);
	selected_year = y;
	// update slider
	output.innerHTML = selected_year;
	slider.value = selected_year;	
	// update world map
	d3.selectAll("path").style("fill", colorScale)
	// 2 countries need to be selected before calling 'visualizeData()'
	if (selectedCountries[1] !== null) {
		visualizeData(selectedCountries[0].id, selectedCountries[1].id);
	}
	drawScatterplot();
}

function barHovered() {
	d3.select(this).classed('barhovered', true);
}

function barMouseOut() {
	//unhover
 	d3.select(this).classed('barhovered', false);
}

function resize() {
	viewWidth = window.innerWidth - (margin.right + margin.left);
	viewHeight = window.innerHeight - (margin.bottom + margin.top);

	halfWidth = viewWidth/2 - 1;
	halfHeight = viewHeight/2 - 1;

	svgInnerHalfWidth = halfWidth - (svgMargin.left + svgMargin.right);
	svgInnerFullHeight = viewHeight - (svgMargin.top + svgMargin.bottom);
	svgInnerHalfHeight = halfHeight - (svgMargin.top + svgMargin.bottom);

	d3.select("#svgMap")
		.attr("width", halfWidth)
		.attr("height", viewHeight)
	
	d3.select("#svgScatter")
		.attr("width", halfWidth)
		.attr("height", halfHeight)
		
	d3.select("#svgComparison")
		.attr("width", halfWidth)
		.attr("height", halfHeight)
		
	d3.select("g")
		.attr("width", halfWidth)
		.attr("height", viewHeight)

	d3.select("g").remove();
	
	drawWorldMap();
	
	//Scatterplot axes
	x.range([0, svgInnerHalfWidth]);
	y.range([svgInnerHalfHeight, 0]);
	
	xAxis.scale(x);
	yAxis.scale(y);
	
	//Dual bar chart axes
	xDualBarChart.rangeRound([0, svgInnerHalfWidth]);
	yDualBarChart.range([svgInnerHalfHeight, 0]);
	
	xAxisDBC.scale(xDualBarChart);
	yAxisDBC.scale(yDualBarChart);

	//2 countries need to be selected before calling 'visualizeData()'
	if (selectedCountries[1] !== null) {
		visualizeData(selectedCountries[0].id, selectedCountries[1].id);
	}
	drawScatterplot();
}

function updateToggle() {
	var prevDoNorm = doNorm;
	doNorm = document.getElementById("ToggleCheckbox").checked;
	var abbrLength = {"long": 16, "short": 10};

	if(doNorm){
		var sign = "/";
		if(multiplyInicatorList.includes(indicator_secondary))
			sign = "*";
		document.getElementById("ToggleStatus").innerHTML = "(" + indicator_primary.substr(0, abbrLength.short) + " <strong>" + sign + "</strong> " + indicator_secondary.substr(0,abbrLength.short) + ")" + " per Year";	
	} else {
		document.getElementById("ToggleStatus").innerHTML = indicator_primary.substr(0, abbrLength.long) + " per Year";
	}

	if(prevDoNorm != doNorm){
		if(selectedCountries[1] != null)
			visualizeData(selectedCountries[0].id, selectedCountries[1].id);
	}
	
}

function initOptions(indicatorNamesList){
	var excludeSecondary = ["Refugees_Total"];

	//fill select lists
	selectPrimary = document.getElementById("select_indicator_primary");
	indicatorNamesList.forEach(function(element){
		var option = document.createElement("option"); 
		option.text = element;
		selectPrimary.add(option);
	});

	selectSecondary = document.getElementById("select_indicator_secondary");
	indicatorNamesList.forEach(function(element){
		if(!excludeSecondary.includes(element)){
			var option = document.createElement("option"); 
			option.text = element;
			selectSecondary.add(option);
		}
	});

	updatePrimaryIndicator();
	updateSecondaryIndicator();

	updateToggle();
}

d3.select(window).on("resize", resize);

slider.oninput = function() {
	setYear(Number(this.value));
}

function yearToIndex(year){
	// Only works if 1951 is index 0 and 2017 is index 66
	return year - 1951;
}

var timer = undefined;

function stop() {
    clearInterval(timer);
    timer = undefined;
    d3.select("button.play").text("Play");
}

function play() {
	if (timer) { stop(); return; };
	if (selected_year == EndYear - 1) {
		selected_year = StartYear;
	}
	d3.select("button.play").text("Stop");
	var advance = function() {
		if (selected_year == EndYear - 1) {
			// stop at endyear - 1
			stop();
			return;
		} else {
			// else advance
			setYear(selected_year+1);
		}
	};
	advance();
	timer = setInterval(advance, 100);
}

// could also make this into an event listener maybe?
function waitForElement(){
    if(typeof countryData !== "undefined"){
		//add options to drowdowns
		initOptions(indicatorList);

		drawWorldMap();
		drawScatterplot();
    }
    else{
        setTimeout(waitForElement, 10);
    }
}
waitForElement();
//drawWorldMap();
