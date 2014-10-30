/* jshint strict: true */

(function() {
	
	"use strict";


	var Graph = function() {

		var width = 900,
			aspect = 1/3,
			height = width * aspect,
			margin = {top: 50, right: 30, bottom: 40, left: 50},
			containerWidth = width - margin.right - margin.left,
			containerHeight = height - margin.top - margin.bottom,
			xAxis, 
			yAxis, 
			scaleX, 
			scaleY, 
			line, 
			tip,
			nitroData = data2,
			cropData = data,
			sideDressData = sidedress;


		this.init = function() {
			document.addEventListener("DOMContentLoaded", this.scaffold(this));
		};

		this.scaffold = function(me) {
			me.formatData(nitroData);
			me.formatData(cropData);
			me.formatData(sideDressData);
			me.setGraphParameters();
			me.render();
		};

		this.formatData = function(thisData) {
			var parseDate = d3.time.format("%d-%b-%y").parse;

			thisData.forEach( function(d) {
				d.date = parseDate(d.date);
				d.close = d.close;
			});
		};

		this.setGraphParameters = function() {

			scaleX =  d3.time.scale()
				.range([0, containerWidth])
				.domain( d3.extent(nitroData, function(d) { return d.date; }) );

			scaleY = d3.scale.linear()
				.range([containerHeight, 0])
				.domain([0, d3.max(nitroData, function(d) { return d.close; }) ]);

			xAxis = d3.svg.axis()
				.scale(scaleX)
				.orient("bottom")
				.tickFormat(d3.time.format("%b %e"));

			yAxis = d3.svg.axis()
				.scale(scaleY)
				.orient("left")
				.ticks(6);

			line = d3.svg.line()
				.x( function(d) { return scaleX(d.date); })
				.y( function(d) { return scaleY(d.close); });

			tip = d3.tip()
				.attr("class", "tip")
				.offset([-50, 0])
				.direction("s")
				.html(function(d) {

					var type = this.classList.contains("nitrogen");
					var tipTitle, 
					  tipDateFormat = d3.time.format("%e %b, %Y"), 
					  tipDate = tipDateFormat(d.date);

					if (type === true) {
					  tipTitle = "Pro available Nitrogen";
					}
					else {
					  tipTitle = "Crop Uptake";
					}

					return tipTitle + " of " + d.close + " lbs/ac on " + tipDate;
				});
		};

		this.render = function() {
			this.createContainer();
			this.renderKeyEvents();
			this.renderGraph(nitroData, "nitrogen");
			this.renderGraph(cropData, "hungryPlants");
			this.renderLegends();
			
		};

		this.createContainer = function() {
			var svg = d3.select("svg")
				.attr("width", width)
				.attr("height", height)
				//.attr('viewBox','0 0 '+Math.min(window.innerWidth, window.innerHeight)+' '+Math.min(window.innerWidth, window.innerHeight))
    		//.attr('preserveAspectRatio','xMinYMin')
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.call(tip);

			this.svg = svg;
		};

		this.renderGraph = function(data, keyword) {
			var graphContainer = this.svg.append("g")
				.attr("width", containerWidth)
				.attr("height", containerHeight);

			graphContainer.append("path")
			.datum(data)
			.attr("d", line)
			.classed("line line--" + keyword, true);

			graphContainer.selectAll("circle")
			.data(data)
			.enter().append("circle")
			.classed("point--" + keyword, true)
			.attr("r", 5)
			.attr("cx", function(d) { return scaleX(d.date);})
			.attr("cy", function(d) { return scaleY(d.close); })
			.on("mouseover", tip.show)
			.on("mouseout", tip.hide);
		};

		this.renderLegends = function() {
			this.svg.append("g")
				.call(xAxis)
				.classed("axis", true)
				.attr("transform", "translate(0," + containerHeight + ")");

			this.svg.append("g")
				.call(yAxis)
				.classed("axis", true)
				.append("text")
				.attr("x", -40)
				.attr("y", -20)
				.text("Nitrogen (lbs N/ac)");
		};

		this.renderKeyEvents = function() {
			var area = d3.svg.area()
				.x( function(d) { return scaleX(d.date); })
				.y0(containerHeight)
				.y1(0);

			this.svg.append("path")
				.datum(sideDressData)
				.classed("sidedress", true)
				.attr("d", area);
		};
	};


	

	var NitrogenApp = function() {

		this.init = function() {
			setup();
			renderGraph();
		};

		function setup() {
			var recs = [].slice.call(document.querySelectorAll(".recommend__item"));
			recs.forEach(function(d) { 
				document.addEventListener("click", learnMore);
			});
			
		}

		function learnMore(e) {
			var target = [].slice.call(document.querySelectorAll("." + e.target.dataset.target));
			target.forEach( function(item) {
					item.classList.toggle("visible");
				});
		}

		function renderGraph() {
			var nitrogenGraph = new Graph();
			nitrogenGraph.init();
		}

	};

	var nitrogenapp = new NitrogenApp();
	nitrogenapp.init();


        
}());
