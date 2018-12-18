// World Map inspired by http://bl.ocks.org/MaciejKus/61e9ff1591355b00c1c1caf31e76a668
// Dual bar chart inspired by https://github.com/liufly/Dual-scale-D3-Bar-Chart and https://bl.ocks.org/mbostock/2368837

// Array function that creates array with values from start to end
Array.range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

// Initialization options
var indicator_primary = "";
var indicator_secondary = "";	
var selectPrimary;
var selectSecondary;
var selectedCountries = [null, null];
// Boolean indicator for normalization of the dual barchart
var doNorm = false;
document.getElementById("ToggleCheckbox").checked = doNorm;

// Initialization configuration
var indicatorList = ["Refugees_Total", "GDP growth (annual %)", "GDP per capita (current US$)", "Population density (people per sq. km of land area)", "Population growth (annual %)"];
var multiplyIndicatorList = ["Population density (people per sq. km of land area)"];
var StartYear = 1951;
var EndYear = 2018;
var xArray = Array.range(StartYear, EndYear);

// Slider initialization
var slider = document.getElementById("year_slider");
var output = document.getElementById("year_value");
// Global value for current selected year
var selected_year = Number(slider.value);
// Display the default slider year value
output.innerHTML = slider.value;

// View settings
// TopPanel height is hardcoded in css to 60px
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

// Global settings for transitions

// Function to set transition speed to default value
function initSettings() {
	document.getElementById("transitionSpeedMultiplier").value = transitionSpeedMultiplier;
}

// Function to initialize list of transition types
function initEaseOptions(easeTypeList) {
	var selectEase = document.getElementById("select_ease_type");
	easeTypeList.forEach(function(element) {
		var option = document.createElement("option");
		option.text = element;
		selectEase.add(option);
	});
	selectedEaseType = selectEase.options[selectEase.selectedIndex].value;
}

var transitionSpeedMultiplier = 1;
initSettings();
var easeTypes = ["easeCubic", "easeLinear", "easeSin"];
var easeConfig = {"easeCubic": d3.easeCubic, "easeLinear": d3.easeLinear, "easeSin": d3.easeSin};
var selectedEaseType = easeTypes[0];
initEaseOptions(easeTypes);

// World Map variables
// Zoom function variable
var zoom = d3.zoom()
	 .scaleExtent([1, 20])
	 .translateExtent([[0, 0], [svgInnerHalfWidth, svgInnerFullHeight]])
	 .on("zoom", zoomed);
// Initialize global zoom level
var zoomk = 1;
// Set offsets for tooltips of World Map
var offsetL = d3.select("#map").node().offsetLeft+10;
var offsetT = d3.select("#map").node().offsetTop+10;

// Add World Map tooltips, default is hidden
var tooltip = d3.select("#map")
	 .append("div")
	 .attr("class", "tooltip hidden");

// Add svg for World Map
var svgMap = d3.select("#map").append("svg")
	.attr("id", "svgMap")
	.attr("width", halfWidth)
	.attr("height", viewHeight)
	.call(zoom);
	
// Scatterpot variables
// Create axes
var x = d3.scaleLinear()
    .range([0, svgInnerHalfWidth]);
var y = d3.scaleLinear()
    .range([svgInnerHalfHeight, 0]);
var xAxis = d3.axisBottom()
    .scale(x);
var yAxis = d3.axisLeft()
    .scale(y);

// Add svg for scatterplot
d3.select("#comparison").append("svg")
	.attr("id", "svgScatter")
	.attr("width", halfWidth)
	.attr("height", halfHeight);	

// Select svg for scatterplot and transform with respect to margins
var svgScatter = d3.select("#svgScatter")
	.append("g")
		.attr("class", "scatterplot")
		.attr("transform", "translate(" + svgMargin.left + "," + svgMargin.top + ")");
		
// Dual bar chart variables
// Create axes
var xDualBarChart = d3.scaleBand()
    .rangeRound([0, svgInnerHalfWidth])
    .padding(0.1);
var yDualBarChart = d3.scaleLinear().range([svgInnerHalfHeight, 0]);
var xAxisDBC = d3.axisBottom()
    .scale(xDualBarChart)
	.tickValues(xArray.filter(function(d,i) { return !((i+1)%5)})); // One tick value for each 5 years
var yAxisDBC = d3.axisLeft()
	.scale(yDualBarChart)
	.ticks(6);

// Add svg for dual bar chart
d3.select("#versus").append("svg")
	.attr("id", "svgComparison")
	.attr("width", halfWidth)
	.attr("height", halfHeight);	

// Select svg for sual bar chart and transform with respect to margins
var svgComparison = d3.select("#svgComparison")
	.append("g")
		.attr("class", "dual bar chart")
		.attr("transform", "translate(" + svgMargin.left + "," + svgMargin.top + ")");

// Domain variable to store all values of the domain in order to determine color scaling
var domain = [];
// Store data.json, our dataset of UNHCR and WorldBank data
var countryData; 

d3.json("resources/data.json", function(error, data) {
	if (error) return console.error(error);	
	countryData = data;
	console.log(countryData)
	
	// Store all domain values for color scaling
	Object.keys(countryData).map(function(c) { 
		if (countryData[c]["Refugees_Total"] != undefined) {
			Object.keys(countryData[c]["Refugees_Total"]).map(function(d) { 
				domain.push(countryData[c]["Refugees_Total"][d]);
			});
		}
	});
});

// Store countries.topo.json, retrieved from https://raw.githubusercontent.com/wrobstory/vincent_map_data/master/world-countries.topo.json @ 18 dec 2018
var worldData; 

d3.json("countries.topo.json", function(error, world) {
	if (error) return console.error(error);
	worldData = world;
});

// Function to update variable indicator_primary
function updatePrimaryIndicator() {
	newIndicatorName = selectPrimary.options[selectPrimary.selectedIndex].value;
	if (newIndicatorName == indicator_primary) {
		console.log("This indicator is already set as primary indicator.");
		return;
	} else if (newIndicatorName == indicator_secondary) {
		console.log("Cannot select same indicator as secondary indicator.");
		return;
	}
	//if newindicator exists display in html and set indicator_primary
	if (indicatorList.includes(newIndicatorName)) {
		indicator_primary = newIndicatorName;
		updateToggle();
		for(i = 0; i < selectSecondary.options.length; i++) {
			var element = selectSecondary.options[i].value;
			if (element == indicator_primary) {
				selectSecondary.options[i].disabled = true;
			} else {
				selectSecondary.options[i].disabled = false;
			}
		}
		if (selectedCountries[1] != null) {
			visualizeData(selectedCountries[0].id, selectedCountries[1].id);
		}
		drawScatterplot(false);
	}
}

// Function to update variable indicator_secondary
function updateSecondaryIndicator() {
	newIndicatorName = selectSecondary.options[selectSecondary.selectedIndex].value;
	if (newIndicatorName == indicator_secondary) {
		console.log("This indicator is already set as secondary indicator.");
		return;
	} else if (newIndicatorName == indicator_primary) {
		console.log("Cannot select same indicator as primary indicator.");
		return; 
	}
	//if newindicator exists display in html and set indicator_secondary
	if (indicatorList.includes(newIndicatorName)) {
		indicator_secondary = newIndicatorName;
		updateToggle();
		for(i = 0; i < selectPrimary.options.length; i++) {
			var element = selectPrimary.options[i].value;
			if (element == indicator_secondary) {
				selectPrimary.options[i].disabled = true;
			} else {
				selectPrimary.options[i].disabled = false;
			}
		}
		if (selectedCountries[1] != null) {
			visualizeData(selectedCountries[0].id, selectedCountries[1].id);
		}
		drawScatterplot(false);
	}
}

// Function to draw the dual bar chart
// dp1: primary indicator values of country 1
// dp2: primary indicator values of country 2
// ds1: secondary indicator values of country 1
// ds2: secondary indicator values of country 2
// transition: boolean
function drawDualBarChart(dp1, dp2, ds1, ds2, transition) {
	// Store data of country 1
	var data1 = [];
	// Store data of country 2
	var data2 = [];
	
	for (var i = 0; i < dp1.length; i++) {
		if (!isNaN(dp1[i]) && dp1[i] != null && (!doNorm || (!isNaN(ds1[i]) && ds1[i] != null))) {
			// Create item for country 1 with values of primary and secondary indicator
			var item = {"pval": dp1[i], "sval": ds1[i], "year": xArray[i]};
			if (!doNorm) {
				// No normalization
				item.computed = item.pval;
			} else {
				if (multiplyIndicatorList.includes(indicator_secondary)) {
					// Normalization through multiplication
					item.computed =  item.pval * item.sval;
				} else {
					// Normalization through division
					item.computed =  item.pval / item.sval;
				}
			}
			// Store value for country 1
			data1.push(item);
		} 
		if (!isNaN(dp2[i]) && dp2[i] != null && (!doNorm || (!isNaN(ds2[i]) && ds2[i] != null) ) ) {
			// Create item for country 2 with values of primary and secondary indicator
			var item = {"pval": dp2[i], "sval": ds2[i], "year": xArray[i]};
			if (!doNorm) {
				// No normalization
				item.computed = item.pval;
			} else {
				if (multiplyIndicatorList.includes(indicator_secondary)) {
					// Normalization through multiplication
					item.computed =  item.pval * item.sval;
				} else {
					// Normalization through division
					item.computed =  item.pval / item.sval;
				}
			}
			// Store value for country 2
			data2.push(item);
		} 
	}

	// Domain for x axis
	var xExtent = xArray;
	// Domain for y axis, make sure y domain contains the 0 value
	var yExtent = d3.extent(data1.concat(data2).concat({"computed": 0}), function(d) { return d.computed; });

	// Add domains to axes
	xDualBarChart.domain(xExtent);
	yDualBarChart.domain(yExtent).nice();

	if (!transition) {
		// Remove current bar chart
		svgComparison.selectAll("g").remove();
		svgComparison.selectAll("text").remove();
		svgComparison.selectAll("rect").remove();

		// Add x axis
		svgComparison.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + yDualBarChart(0) + ")")
			.call(xAxisDBC);
			
		// Add text label Year to x axis
		svgComparison.append("text")
			.attr("class", "label")
			.attr("id", "xLabel")
			.attr("transform", "translate(" + (svgInnerHalfWidth/2) + " ," + (svgInnerHalfHeight + svgMargin.top + 10) + ")")
			.style("text-anchor", "start")
			.text("Year");
		
		// Add y axis
		svgComparison.append("g")
			.attr("class", "y axis axisLeft")
			.call(yAxisDBC);

		// Set correct y axis label
		var newIndicatorLabel = indicator_primary;
		doNorm = document.getElementById("ToggleCheckbox").checked;
		if (doNorm) {
			var abbrLength = {"long": 16, "short": 10};
			var sign = "/";
			if (multiplyIndicatorList.includes(indicator_secondary))
				sign = "*";
			newIndicatorLabel = "(" + indicator_primary.substr(0, abbrLength.short) + sign + indicator_secondary.substr(0,abbrLength.short) + ")" + " per Year";
		}

		// Add text label to y axis
		svgComparison.append("text")
			.attr("class", "label")
			.classed("labelPrim", true)
			.attr("id", "yLabel")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - svgMargin.left)
			.attr("dy", "1em")
			.style("text-anchor", "end")
			.text(newIndicatorLabel);
			
		// Add bars for country 1
		svgComparison.selectAll(".bar1")
			.data(data1)
		.enter().append("rect")
			.attr("class", "bar1")
			.attr("x", function(d) { return xDualBarChart(d.year); })
			.attr("width", xDualBarChart.bandwidth()/2)
			.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
			.attr("height", function(d,i,j) { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
			.attr("year", function(d) { return d.year; })
			.on("click", function(d) { setYear(d.year) })
			.on("mouseout",  barMouseOut)
			.on("mouseover", barHovered); 
			
		// Add bars for country 2
		svgComparison.selectAll(".bar2")
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
	} else { // Transition
		var	transitionTime = 1500 / transitionSpeedMultiplier;

		// Store bars with new data for selected countries
		var bars1 = svgComparison.selectAll(".bar1")
			.data(data1, function(d) { return d.year});
		var bars2 = svgComparison.selectAll(".bar2")
			.data(data2, function(d) { return d.year});

		// Enter new data for country 1 using transition
		bars1.enter()
			.append("rect")
			.attr("class", "bar1")
			.attr("x", function(d) { return xDualBarChart(d.year); })
			.attr("width", xDualBarChart.bandwidth()/2)
			.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
			.attr("height", function(d,i,j) { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
			.attr("year", function(d) { return d.year; })
			.on("click", function(d) { setYear(d.year) })
			.on("mouseout",  barMouseOut)
			.on("mouseover", barHovered)
			.attr("opacity", 0)
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("opacity", 1);

		// Standard transition
		bars1.interrupt()
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("class", "bar1")
			.attr("x", function(d) { return xDualBarChart(d.year); })
			.attr("width", xDualBarChart.bandwidth()/2)
			.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
			.attr("height", function(d,i,j) { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
			.attr("year", function(d) { return d.year; })
			.attr("opacity", 1);

		// Remove old data
		bars1.exit()
			.interrupt()
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("opacity", 0)
			.remove();

		// Enter new data for country 2 using transition
		bars2.enter()
			.append("rect")
			.attr("class", "bar2")
			.attr("x", function(d) { return xDualBarChart(d.year) + xDualBarChart.bandwidth()/2; })
			.attr("width", xDualBarChart.bandwidth()/2)
			.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
			.attr("height", function(d,i,j)  { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
			.attr("year", function(d) { return d.year; })
			.on("click", function(d) { setYear(d.year) })
			.on("mouseout",  barMouseOut)
			.on("mouseover", barHovered)
			.attr("opacity", 0)
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("opacity", 1);

		// Standard transition
		bars2.interrupt()
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("class", "bar2")
			.attr("x", function(d) { return xDualBarChart(d.year) + xDualBarChart.bandwidth()/2; })
			.attr("width", xDualBarChart.bandwidth()/2)
			.attr("y", function(d) { return yDualBarChart(Math.max(0,d.computed)); })
			.attr("height", function(d,i,j)  { return Math.abs(yDualBarChart(d.computed) - yDualBarChart(0)); })
			.attr("year", function(d) { return d.year; })
			.attr("opacity", 1);

		// Remove old data
		bars2.exit()
			.interrupt()
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("opacity", 0)
			.remove();

		// Transition for y axis
		svgComparison.select(".y.axis")
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.call(yAxisDBC)

		// Transition for x axis
		svgComparison.select(".x.axis")
			.transition()
			.ease(easeConfig[selectedEaseType])
			.attr("transform", "translate(0," + yDualBarChart(0) + ")")
			.duration(transitionTime)
			.call(xAxisDBC)
	} 	
}

// TODO: ???
function setter() {
  var s,
      props = [];
  function add(type) {
    return function(key,value) {
      props.push({type: type, key: key, value: value});
      return s;
    };
  }
  function set() {
    return function(selection) {
      if (!(selection instanceof d3.selection || selection instanceof d3.transition)) {
          selection  = d3.select(this);
      }
      props.forEach(function(prop) {
        selection[prop.type](prop.key,prop.value);
      });
    };
  }
  return s = {
    style: add("style"),
    attr: add("attr"),
    set: set
  };
}

// Function to draw the scatterplot
// transition: boolean
// transitionTime: transition time in milliseconds
// isPlay: boolean
function drawScatterplot(transition, transitionTime, isPlay) {
	// Store values of primary indicators
	var d1 = {}; 
	// Store values of secondary indicators
	var d2 = {}; 
	// Store items with values of primary indicators, secondary indicators and ISO code
	var data = [];
	// Store overall values of primary indicators
	var overall1 = [];
	// Store overall values of secondary indicators
	var overall2 = [];

	Object.keys(countryData).map(function(c) { 
		if (countryData[c][indicator_primary] != undefined) {
			d1[c] = countryData[c][indicator_primary][selected_year - StartYear];
			if (isPlay) { // If animation then extent over all values for all years to keep axis stable
				overall1 = overall1.concat(countryData[c][indicator_primary]);
			}
		}
		if (countryData[c][indicator_secondary] != undefined) {
			d2[c] = countryData[c][indicator_secondary][selected_year - StartYear]
			if (isPlay) { // If animation then extent over all values for all years to keep axis stable
				overall2 = overall2.concat(countryData[c][indicator_secondary]);
			}
		}
	});

	Object.keys(d1).map(function(c) { 
		if (!isNaN(d1[c]) && d1[c] != null && !isNaN(d2[c]) && d2[c] != null) {
			var item = {indicator_primary: d1[c], indicator_secondary: d2[c], ISO_code: c};
			data.push(item);
		}
	});
	
	// Domains for axes
	var xExtent;
	var yExtent;

	// Set domains for axes
	if (isPlay) {
		yExtent = d3.extent(Object.values(overall1));
		xExtent = d3.extent(Object.values(overall2));
	} else {
		yExtent = d3.extent(Object.values(d1));
		xExtent = d3.extent(Object.values(d2));		
	}

	// Add nice domain to axes
	x.domain(xExtent).nice();
	y.domain(yExtent).nice();

	if (!transition) { //no transition
		// Remove current scatterplot
		svgScatter.selectAll("g").remove();
		svgScatter.selectAll("text").remove();
		svgScatter.selectAll("circle").remove();
		
		// Add x axis
		svgScatter.append("g")
			.attr("id", "xAxis")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + svgInnerHalfHeight + ")")
			.call(xAxis);
		
		// Add secondary indicator as x axis label
		svgScatter.append("text")
			.attr("class", "label")
			.attr("id", "xLabel")
			.attr("transform", "translate(" + (svgInnerHalfWidth/2) + " ," + (svgInnerHalfHeight + svgMargin.top + 10) + ")")
			.style("text-anchor", "start")
			.text(indicator_secondary);

		// Add y axis
		svgScatter.append("g")
			.attr("id", "yAxis")
			.attr("class", "y axis")
			.call(yAxis);
			
		// Add primary indicator as y axis label
		svgScatter.append("text")
			.attr("class", "label")
			.attr("id", "yLabel")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - svgMargin.left)
			.attr("dy", "1em")
			.style("text-anchor", "end")
			.text(indicator_primary);

		// Create scatterplot dots
		svgScatter.selectAll(".dot")
			.data(data, function(d) {return d.ISO_code; })
	    .enter().append("circle")
			.attr("r", dotRadius)
			.attr("cx", function(d) { return x(d.indicator_secondary); })
			.attr("cy", function(d) { return y(d.indicator_primary); })
			.attr("countryCode", function(d) { return d.ISO_code; })
			.attr("class", colorDots)
			.on("mousemove", showDotTooltip)
			.on("mouseover", dotHovered)
			.on("mouseout",  dotMouseOut)
			.on("click", function(d) { setSelected(d3.selectAll("#" + d.ISO_code).nodes()[0]); });
	} else { //transition
		var transitionPretty = false;
		// Set default transitionTime to 1500 milliseconds
		if (typeof transitionTime === "undefined") {
			transitionTime = 1500;
			transitionPretty = true;
		}

		// Use selected transition speed multiplier
		transitionTime = transitionTime / transitionSpeedMultiplier;
		
		// Add data to dots
		var circle = svgScatter.selectAll("circle")
			.data(data, function(d) {return d.ISO_code; });

		if (transitionPretty) { //take more time with delays to introduce new elements
		
			// Enter new dots using transition
			circle.enter()
				.append("circle")
				.attr("cx", function(d) { return x(d.indicator_secondary); })
				.attr("cy", function(d) { return y(d.indicator_primary); })
				.attr("countryCode", function(d) { return d.ISO_code; })
				.attr("class", colorDots)
				.on("mousemove", showDotTooltip)
				.on("mouseover", dotHovered)
				.on("mouseout",  dotMouseOut)
				.on("click", function(d) { setSelected(d3.selectAll("#" + d.ISO_code).nodes()[0]); })
				.attr("opacity", "0")
				.attr("r", 0)
				.transition()
				.ease(easeConfig[selectedEaseType])
				.delay(function(d, i) { return transitionTime/2 + ((i / data.length) * 100) })
				.duration(transitionTime)
				.attr("opacity", "1")
				.attr("r", dotRadius);

			// Standard transition
			circle.interrupt()
				.transition()
				.ease(easeConfig[selectedEaseType])
				.duration(transitionTime)
				.delay(function(d, i) {return i / data.length * 100})
				.attr("r", dotRadius)
				.attr("cx", function(d) { return x(d.indicator_secondary); })
				.attr("cy", function(d) { return y(d.indicator_primary); })
				.attr("countryCode", function(d) { return d.ISO_code; })
				.attr("class", colorDots)
				.attr("opacity", "1");
		} else {
			// Enter new dots using transition
			circle.enter()
				.append("circle")
				.attr("cx", function(d) { return x(d.indicator_secondary); })
				.attr("cy", function(d) { return y(d.indicator_primary); })
				.attr("countryCode", function(d) { return d.ISO_code; })
				.attr("class", colorDots)
				.on("mousemove", showDotTooltip)
				.on("mouseover", dotHovered)
				.on("mouseout",  dotMouseOut)
				.on("click", function(d) { setSelected(d3.selectAll("#" + d.ISO_code).nodes()[0]); })
				.attr("opacity", "0")
				.attr("r", 0)
				.transition()
				.ease(easeConfig[selectedEaseType])
				.duration(transitionTime)
				.attr("opacity", "1")
				.attr("r", dotRadius);

			// Standard transition
			circle.interrupt()
				.transition()
				.ease(easeConfig[selectedEaseType])
				.duration(transitionTime)
				.attr("r", dotRadius)
				.attr("cx", function(d) { return x(d.indicator_secondary); })
				.attr("cy", function(d) { return y(d.indicator_primary); })
				.attr("countryCode", function(d) { return d.ISO_code; })
				.attr("class", colorDots)
				.attr("opacity", "1");
		}

		// Remove old data
		circle.exit()
			.interrupt()
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.attr("r", 0)
			.attr("opacity", 0)
			.remove();		

		// Transition for x axis
		svgScatter.select(".x.axis")
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.call(xAxis)

		// Transition for y axis
		svgScatter.select(".y.axis")
			.transition()
			.ease(easeConfig[selectedEaseType])
			.duration(transitionTime)
			.call(yAxis)
	}
	// move selected countrydots to front	
	d3.select(".dotscountry1").moveToFront();
	d3.select(".dotscountry2").moveToFront();
}

// Function to initialize dual bar chart
// c1: ISO code of country 1
// c2: ISO code of country 2
// transition: boolean
function visualizeData(c1, c2, transition) {
	// Initialization variables
	var TimeLength = EndYear - StartYear;
	var data_1 				= new Array(TimeLength);
	var data_1_secondary 	= new Array(TimeLength);
	var data_2 				= new Array(TimeLength);
	var data_2_secondary 	= new Array(TimeLength);
	var hasData_1 			= false;
	var hasData_1_secondary = false;
	var hasData_2 			= false;
	var hasData_2_secondary = false;

	if (typeof countryData[c1] === 'undefined') {
		// Fill arrays with null values for unknown country
		data_1.fill(null, 0, TimeLength);
		data_1_secondary.fill(null, 0, TimeLength);
	} else {
		// Fill arrays with data for country 1
		data_1 = countryData[c1][indicator_primary];
		data_1_secondary = countryData[c1][indicator_secondary];
		hasData_1 = true;
	}

	if (typeof countryData[c2] === 'undefined') {
		// Fill arrays with null values for unknown country
		data_2.fill(null, 0, TimeLength);
		data_2_secondary.fill(null, 0, TimeLength);
	} else {
		// Fill arrays with data for country 2
		data_2 = countryData[c2][indicator_primary];
		data_2_secondary = countryData[c2][indicator_secondary];
		hasData_2 = true;
	}
	
	// Draw bar chart if there is data
	if (hasData_1 || hasData_2) {
		if (typeof transition !== "undefined") {
			drawDualBarChart(data_1, data_2, data_1_secondary, data_2_secondary, transition);
		} else {
			drawDualBarChart(data_1, data_2, data_1_secondary, data_2_secondary);
		}
	} else {
		// Notify user of no data for selection
		alert('No Data for selection.');
	}
}

// Function to draw the world map
function drawWorldMap() {
	// Calculate the mercator projection
	var projection = d3.geoMercator()
		.scale((Math.min(halfWidth,viewHeight)/500)*100)
		.translate([halfWidth/2,viewHeight/1.5])
	
	// Calculate the paths for the projection
	var path = d3.geoPath()
		.projection(projection);
		
	// Need this wrapper for correct panning
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
			.style("fill", colorScale);	
	
	// Create the interval values for the legend
	intervals = d3.scaleQuantile().domain(domain).range(d3.schemeYlGnBu[9]).quantiles();
	// Round values to integers
	intervalsrounded = intervals.map(function(d) { return Math.round(d) });

	// Adding legend to map
	var legend = g.selectAll("g.legend")
		.data(intervalsrounded)
		.enter().append("g")
		.attr("class", "legend");

	// Colorfunction using a sequential multi-hue color scheme based on the data
	var colorsFunction = d3.scaleQuantile().domain(domain).range(d3.schemeYlGnBu[9]);	
	
	// Legend positions
	var ls_w = 20, ls_h = 20; var height = 200;
	
	// Add legend boxes
	legend.append("rect")
		.attr("x", 20)
		.attr("y", function(d, i) { return height - (i*ls_h) - 2*ls_h;})
		.attr("width", ls_w)
		.attr("height", ls_h)
		.style("fill", function(d, i) { return colorsFunction.range()[i+1]; });

	// Add legend text
	legend.append("text")
		.attr("x", 50)
		.attr("y", function(d, i) { return height - (i*ls_h) - ls_h - 4;})
		.text(function(d, i) { return intervalsrounded[i]; });
}

// Function which returns the color for a country
function colorScale(d) {	
	if (d != null) {
		var countryCode = d.id
		var colors = d3.scaleQuantile().domain(domain).range(d3.schemeYlGnBu[9]);			
		if (countryData[countryCode]) {
			if (countryData[countryCode]["Refugees_Total"]) {
				value = countryData[countryCode]["Refugees_Total"][selected_year - StartYear];
				return colors(value);
			} else {
				// No data available for this country
				return "white"
			}
			
		} else {
			// This country code is unknown
			return "white"
		}
	}
}

// Function which returns css classes for the scatterplot dots
// d: Country object
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

// Function which returns default dot radius 3.5 and 7 for selected country dots
// d: Country object
function dotRadius(d) { 
	if (selectedCountries[0] == null || selectedCountries[1] == null) {
		return 3.5;
	} else if (d.ISO_code == selectedCountries[0].id || d.ISO_code == selectedCountries[1].id) {
		return 7;
	} else {
		return 3.5;
	}
}

// Function that shows tooltip for scatterplot and highlights corresponding country on world map
// d: Country object
function showDotTooltip(d) {
	country = document.getElementById(d.ISO_code);
	label = d.ISO_code;
	
	if (country != null) {
		// Color border of country of the dot
		country.classList.add('countrydothovered');
		country.setAttribute("stroke-width", 5/zoomk + "px");
		
		// Label for tooltip
		label = country.getAttribute("name");
	}
	// Add tooltip
	var mouse = d3.mouse(svgScatter.node())
		.map(function(d) { return parseInt(d); } );
	tooltip.classed("hidden", false)
		.attr("style", "left:"+(mouse[0]+halfWidth+svgMargin.left+margin.left+offsetL)+"px;top:"+(mouse[1]+halfHeight+svgMargin.top+offsetT)+"px")
		.html(label);
}

// Function that hides the tooltip and decolors country border on word map
function dotMouseOut(d) {
	// Hide tooltip
	tooltip.classed("hidden", true);
	// Unhover
 	d3.select('.countrydothovered').classed('countrydothovered', false);
	d3.select('.dothovered').classed('dothovered', false);
	// Uncolor country border
	country = document.getElementById(d.ISO_code);
	if (country != null) {
		country.classList.remove('countrydothovered');
		if (selectedCountries[0] === null || (country.id != selectedCountries[0].id && (selectedCountries[1] === null || country.id != selectedCountries[1].id))) { 
			country.setAttribute("stroke-width", 1/zoomk + "px");
		}
	}
}

// Moves an element to the front
d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

// Set css of dot to dothovered and moves it to the front
function dotHovered() {
	d3.select('.dothovered').classed('dothovered', false);
	d3.select(this).classed('dothovered', true);
	// Move dot to front
	d3.select(this).moveToFront();
}

// Show tooltip of country on world map
// d: Country object
function showTooltip(d) {
  label = d.properties.name;
  var mouse = d3.mouse(svgMap.node())
	.map(function(d) { return parseInt(d); } );
  tooltip.classed("hidden", false)
	.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
	.html(label);
}

// Hides tooltip on world map and unhighlights contry
function mouseOut() {
	// Hide tooltip
	tooltip.classed("hidden", true);
	// Unhover
 	d3.select('.hovered').classed('hovered', false);
	if (this.id != -99) {
		// Unhighlight dot in scatterplot
		d3.select("[countryCode=" + this.id + "]").classed('dothovered', false);
		if (!(d3.select(this).classed('selected_1') || d3.select(this).classed('selected_2'))) {
			d3.select("[countryCode=" + this.id + "]").attr('r', 3.5);
		} 
	}
}

// Remove css class hovered and select the country
function clicked() {
 	//unhover
 	d3.select('.hovered').classed('hovered', false);	
 	//handle click
 	setSelected(this);
}

// Unselect countries and remove selected country styles
function resetCountrySelection() {
	selectedCountries.forEach(function(elem) {
		if (elem === null) {
		} else {
			d3.select(elem).classed('selected_1', false);
			d3.select(elem).classed('selected_2', false);
			d3.select(elem).attr("stroke-width", 1/zoomk + "px");
		}
	})
	selectedCountries = [null, null];
	// Clear scatterplot
	drawScatterplot(false);
	// Clear dual bar chart
	svgComparison.selectAll("g").remove();
	svgComparison.selectAll("text").remove();
	svgComparison.selectAll("rect").remove();
}

// Behaviour: replace 2nd selection
function setSelected(element) {
	var transition = true;
	if (selectedCountries[0] === element || selectedCountries[1] === element) {
		return;
	}
	if (selectedCountries[0] === null) { // If no countries selected set 1st selection
		selectedCountries[0] = element;
		document.getElementById("SelectedCountry_1").innerHTML = selectedCountries[0].__data__.properties.name;
		d3.select(selectedCountries[0]).classed('selected_1', true);
		d3.select(selectedCountries[0]).attr("stroke-width", 5/zoomk + "px");
		if (selectedCountries[0].id != -99) {
			// Highlight dot country 1 in scatterplot
			d3.select("[countryCode=" + selectedCountries[0].id + "]").classed('dotscountry1', true);
			d3.select("[countryCode=" + selectedCountries[0].id + "]").attr('r', 7);
		}
	} else { // If 1st country selected set 2nd selection
		if (selectedCountries[1] !== null) { // If 2nd country selected then unselect and remove class
			d3.select(selectedCountries[1]).classed('selected_2', false);
			d3.select(selectedCountries[1]).attr("stroke-width", 1/zoomk + "px");
			if (selectedCountries[1].id != -99) {
				// Unhighlight country 2 in scatterplot
				d3.select("[countryCode=" + selectedCountries[1].id + "]").classed('dotscountry2', false);
				d3.select("[countryCode=" + selectedCountries[1].id + "]").attr('r', 3.5);
			}
		} else { // 1st time to draw dual bar chart, dont transition
			transition = false;
		}
		selectedCountries[1] = element;
		document.getElementById("SelectedCountry_2").innerHTML = selectedCountries[1].__data__.properties.name;
		d3.select(selectedCountries[1]).classed('selected_2', true);
		d3.select(selectedCountries[1]).attr("stroke-width", 5/zoomk + "px");
		visualizeData(selectedCountries[0].id, selectedCountries[1].id, transition);
		if (selectedCountries[1].id != -99) {
			// Highlight dot country 2 in scatterplot
			d3.select("[countryCode=" + selectedCountries[1].id + "]").classed('dotscountry2', true);
			d3.select("[countryCode=" + selectedCountries[1].id + "]").attr('r', 7);
		}
	}
}

// Highlight hovered country dot in scatterplot and in world map
function hovered() {
	// If selected do nothing
	if (d3.select(this).classed('selected')) {
		return;
	} 
	// Highlight corresponding dot in scatterplot
	if (this.id != -99) {
		d3.select("[countryCode=" + this.id + "]").classed('dothovered', true);
		d3.select("[countryCode=" + this.id + "]").attr('r', 7);
		// move country dot to front
		d3.select("[countryCode=" + this.id + "]").moveToFront();
	}
	// Highlight country in worldmap
	d3.select('.hovered').classed('hovered', false);
	d3.select(this).classed('hovered', true);
}

// Handles zoom event on world map
function zoomed() {
	zoomk = d3.event.transform.k;

	d3.select("g").attr("transform", d3.event.transform);

	// Adjust the stroke width based on zoom level
	d3.selectAll("path").attr("stroke-width", 1 / zoomk);

	// Put class selected on selection
	selectedCountries.forEach(function(elem) {
		if (elem === null) {
		} else {
			d3.select(elem).attr("stroke-width", 5/zoomk + "px");
		}
	})
}

// Set the global current selected year variable
// y: year integer
// transitionTime: transition time in milliseconds
// isPlay: boolean
function setYear(y, transitionTime, isPlay) {
 	// Set selected year to y
	selected_year = y;
	// Update slider
	output.innerHTML = selected_year;
	slider.value = selected_year;	
	// Update world map
	d3.selectAll("path").style("fill", colorScale)
	// Update the dual bar chart
	// 2 countries need to be selected before calling 'visualizeData()'
	if (selectedCountries[1] !== null) {
		visualizeData(selectedCountries[0].id, selectedCountries[1].id, true);
	}
	// Update the scatterplot
	if (typeof transitionTime !== "undefined") {
		if (isPlay) {
			drawScatterplot(true, transitionTime, true);
		} else {
			drawScatterplot(true, transitionTime);
		}
	} else {
		drawScatterplot(true);
	}
}

// Set css class to barhovered
function barHovered() {
	d3.select(this).classed('barhovered', true);
}

// Remove css class barhovered
function barMouseOut() {
	//unhover
 	d3.select(this).classed('barhovered', false);
}

// Handles a window resize
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
		visualizeData(selectedCountries[0].id, selectedCountries[1].id, true);
	}
	drawScatterplot(false);
}

// Called when user clicks the toggle checkbox to normalize the dual bar chart
function updateToggle() {
	var prevDoNorm = doNorm;
	doNorm = document.getElementById("ToggleCheckbox").checked;
	var abbrLength = {"long": 16, "short": 10};

	var newIndicatorLabel;

	if (doNorm) {
		var sign = "/";
		if (multiplyIndicatorList.includes(indicator_secondary))
			sign = "*";
		newIndicatorLabel = "(" + indicator_primary.substr(0, abbrLength.short) + sign + indicator_secondary.substr(0,abbrLength.short) + ")" + " per Year";
		var newIndicatorHTML = "(" + indicator_primary.substr(0, abbrLength.short) + " <strong>" + sign + "</strong> " + indicator_secondary.substr(0,abbrLength.short) + ")" + " per Year";

		document.getElementById("ToggleStatus").innerHTML = newIndicatorHTML;

	} else {
		newIndicatorLabel = indicator_primary.substr(0, abbrLength.long) + " per Year";
		document.getElementById("ToggleStatus").innerHTML = newIndicatorLabel;
	}

	if (prevDoNorm != doNorm) {
		if (selectedCountries[1] != null)
			visualizeData(selectedCountries[0].id, selectedCountries[1].id);
		d3.select("#yLabel")
			.text(newIndicatorLabel);
	}
	
}

function initOptions(indicatorNamesList) {
	var excludeSecondary = ["Refugees_Total"];

	// Fill select lists
	selectPrimary = document.getElementById("select_indicator_primary");
	indicatorNamesList.forEach(function(element) {
		var option = document.createElement("option"); 
		option.text = element;
		selectPrimary.add(option);
	});

	selectSecondary = document.getElementById("select_indicator_secondary");
	indicatorNamesList.forEach(function(element) {
		if (!excludeSecondary.includes(element)) {
			var option = document.createElement("option"); 
			option.text = element;
			selectSecondary.add(option);
		}
	});

	updatePrimaryIndicator();
	updateSecondaryIndicator();

	updateToggle();
}

function updateEaseType() {
	var selectEase = document.getElementById("select_ease_type");
	selectedEaseType = selectEase.options[selectEase.selectedIndex].value;
}

d3.select(window).on("resize", resize);

slider.oninput = function() {
	setYear(Number(this.value));
}

var timer = undefined;

function stop() {
    clearInterval(timer);
    timer = undefined;
    d3.select("button.play").text("Play");
}

function play() {
	var transitionTime = 500;
	var transitionPause = 80;
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
			setYear(selected_year+1, transitionTime, true);
		}
	};
	advance();
	timer = setInterval(advance, (transitionTime + transitionPause) / transitionSpeedMultiplier);
}


function toggleShowSettings() {
	var settingsElem = document.getElementById("settings");
	if (settingsElem.style.display === "none") {
		settingsElem.style.display = "inline";
	} else {
		settingsElem.style.display = "none";
	}
}

function updateTransitionSpeed() {
	transitionSpeedMultiplier = document.getElementById("transitionSpeedMultiplier").value;
}

// Waits untill the country data is read and draws world map and scatterplot
function waitForElement() {
    if (typeof countryData !== "undefined") {
		// Add options to drowdowns
		initOptions(indicatorList);

		drawWorldMap();
		drawScatterplot(false);
    }
    else{
        setTimeout(waitForElement, 10);
    }
}

waitForElement();