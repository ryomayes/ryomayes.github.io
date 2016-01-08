//Graph margin and parameter setup
var margin = {top: 20, right: 60, bottom: 60, left: 60}
var width = 600 - margin.right - margin.left;
var height = 400 - margin.top - margin.bottom;

var xScale = d3.scale.linear()
					.range([0, width]);

					
var yScale = d3.scale.linear()
					.range([height, 0]);

var xAxis = d3.svg.axis()
				.scale(xScale)
				.orient("bottom")
				.tickFormat(d3.format("d"));

var yAxis = d3.svg.axis()
				.scale(yScale)
				.orient("left");

var svg = d3.select("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var line = d3.svg.line()
			.interpolate("cardinal")
			.x(function(d) {
				return xScale(d.key);
			})
			.y(function(d) {
				return yScale(d.values.avgAge);
			});

d3.csv("data/all_player_rankings_ages.csv", function(error, dataset) {
	
	if (error) throw error;

	dataset.forEach(function(d) {
		d.firstname = d.firstname;
		d.lastname = d.lastname;
		d.ranking = +d.ranking;
		d.age = +d.age;
		d.year = +d.year;
	});

	var toggle = false;
	var topPlayers = "100";

	var allPlayers = dataset.sort(function(a, b) {
			return a.year - b.year;
	});

	var playersByYear = d3.nest()
							.key(function(d) { return d.year; })
							.rollup(function(v) { 
								return {
									avgAge: d3.round(d3.mean(v, function(d) { return d.age; }), 2),
									maxAge: d3.max(v, function(d) { return [d.age, d.firstname, d.lastname, d.ranking]; }),
									minAge: d3.min(v, function(d) { return [d.age, d.firstname, d.lastname, d.ranking]; })
								};
							})
							.entries(allPlayers);

	var topHundred = playersByYear;

	minYear = d3.min(playersByYear, function(d) {
				return +d.key;
			});
	maxYear = d3.max(playersByYear, function(d) {
				return +d.key;
			});
	minAvgAge = d3.min(playersByYear, function(d) {
				return +d.values.avgAge;
			});
	maxAvgAge = d3.max(playersByYear, function(d) {
				return +d.values.avgAge;
			});



	xScale.domain([minYear, maxYear]);
	yScale.domain([minAvgAge - 2, maxAvgAge + 2]);


	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	svg.append("text")
		.attr("x", width)
		.attr("y", height - 5)
		.style("text-anchor", "end")
		.style("font-size", "1.25em")
		// .attr("opacity", "0.5")
		.text("Year");

	svg.append("text")
		.attr("x", 35)
		.attr("dx", 0)
		.attr("y", -8)
		.attr("transform", "rotate(90)")
		// .attr("opacity", "0.5")
		.style("text-anchor", "end")
		.style("font-size", "1.25em")
		.text("Age");

	var trend = svg.append("path")
		.datum(playersByYear)
		.attr("class", "line")
		.attr("d", line);


	// Define a line and circle tracker.

	var focus = svg.append("g")
					.attr("class", "focus")
					.style("display", "none");

	var tracker = focus.append("line")
		.attr("y2", height);

	var circ = focus.append("circle")
		.attr("r", 3.5);

	var info = d3.select("#chart-wrapper").select(".info");

	// Custom bisect function. 
	var bisect = d3.bisector(function(d) { return +d.key }).left;

	svg.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height", height)
		.on("mouseover", function() { focus.style("display", null); }) //#
			.on("mouseout", function() { focus.style("display", "none"); }) //#
		.on("mousemove", mousey);

	function mousey() {
		var x0 = xScale.invert(d3.mouse(this)[0]), // <-- Get the x-value based on the mouse position.
			i = bisect(playersByYear, x0, 1), // <-- Get the closest index in the playersByYear dataset. (Bounded by 1)
			d0 = playersByYear[i - 1], // <--- The previous normalized value in playersByYear.
			d1 = playersByYear[i], // <------- The current normalized value in playersByYear.
			d = x0 - +d0.key > +d1.key - x0 ? d1 : d0; // <----- If the difference between the mouse's x-value and the
													   // normalized x-value preceding it is greater than the difference 
													   // of the current normalized x-value and the mouse's x-value, grab
													   // the current normalized x-value. Else, grab the preceding x-value.

		circ.attr("transform", "translate(" + xScale(d.key) + "," + yScale(d.values.avgAge) + ")");
		tracker.attr("transform", "translate(" + xScale(d.key) + "," + "0)");
		info.select("#p1").text("The average age of the ATP top " + topPlayers + " in " + d.key + " was " + d.values.avgAge + ".");
		info.select("#p2").text("The oldest player was " + d.values.maxAge[1] + " " + d.values.maxAge[2] + " at age " + d.values.maxAge[0] + ", ranked number " + d.values.maxAge[3] + " in the world.");
		info.select("#p3").text("The youngest player was " + d.values.minAge[1] + " " + d.values.minAge[2] + " at age " + d.values.minAge[0] + ", ranked number " + d.values.minAge[3] + " in the world.");
	}

	//Showing only the top ten

	d3.select("#update")
		.on("click", function() {

			if (!toggle) {
				var updated = allPlayers.filter(function(d) { return d.ranking <= 10; });
				var topTen = d3.nest()
								.key(function(d) { return d.year; })
								.rollup(function(v) { 
									return {
										avgAge: d3.round(d3.mean(v, function(d) { return d.age; }), 2),
										maxAge: d3.max(v, function(d) { return [d.age, d.firstname, d.lastname, d.ranking]; }),
										minAge: d3.min(v, function(d) { return [d.age, d.firstname, d.lastname, d.ranking]; })
									};
								})
								.entries(updated);

				playersByYear = topTen;
				minYear = d3.min(playersByYear, function(d) {
					return +d.key;
				});
				maxYear = d3.max(playersByYear, function(d) {
					return +d.key;
				});
				minAvgAge = d3.min(playersByYear, function(d) {
					return +d.values.avgAge;
				});
				maxAvgAge = d3.max(playersByYear, function(d) {
					return +d.values.avgAge;
				});

				xScale.domain([minYear, maxYear]);
				yScale.domain([minAvgAge - 2, maxAvgAge + 2]);

				trend.datum(playersByYear)
				.transition()
				.duration(500)
				.attr("class", "line")
				.attr("d", line);
				
				toggle = true;
				topPlayers = "10";
				d3.select("#update").text("View top 100 average ages");
				d3.select("#chart-wrapper span").text("10");
			} else {
				playersByYear = topHundred;
				minYear = d3.min(playersByYear, function(d) {
					return +d.key;
				});
				maxYear = d3.max(playersByYear, function(d) {
					return +d.key;
				});
				minAvgAge = d3.min(playersByYear, function(d) {
					return +d.values.avgAge;
				});
				maxAvgAge = d3.max(playersByYear, function(d) {
					return +d.values.avgAge;
				});

				xScale.domain([minYear, maxYear]);
				yScale.domain([minAvgAge - 2, maxAvgAge + 2]);

				trend.datum(playersByYear)
				.transition()
				.duration(500)
				.attr("class", "line")
				.attr("d", line);

				d3.select("#update").text("View top 10 average ages");
				d3.select("#chart-wrapper span").text("100");
				topPlayers = "100";
				toggle = false;
			}
		});
});