/* jshint strict: true */

(function() {
	
	"use strict";

	var fetchedData, eventsData;

// get data
 	var Data = function() {
 		
 		this.init = function(url) {

 			// Return a new promise.
  		return new Promise(function(resolve, reject) {
		    // Do the usual XHR stuff
		    var req = new XMLHttpRequest();
		    req.open('GET', url);

		    req.onload = function() {
		      // This is called even on 404 etc
		      // so check the status
		      if (req.status == 200) {
		        // Resolve the promise with the response text
		        resolve(req.response);
		      }
		      else {
		        // Otherwise reject with the status text
		        // which will hopefully be a meaningful error
		        reject(Error(req.statusText));
		      }
		    };

		    // Handle network errors
		    req.onerror = function() {
		      reject(Error("Network Error"));
		    };

		    // Make the request
		    req.send();
		  });
 		};
	
	};


// create graph
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
			startDate = "2012-09-05",
			endDate = "2013-09-11",
			nitroData,
			cropData;

		this.init = function(data) {
			nitroData = data["available-n-g_m2"].mean;
			cropData = data["potential-n-uptake-g_m2_day"].mean;

			document.addEventListener("DOMContentLoaded", this.scaffold(this));
		};

		this.scaffold = function(me) {
			me.setGraphParameters();
			me.render();
		};

		this.setGraphParameters = function() {
			var date1 = formatDate(startDate),
				date2 = formatDate(endDate);

			scaleX =  d3.time.scale()
				.range([0, containerWidth])
				.domain([date1, date2]);

			scaleY = d3.scale.linear()
				.range([containerHeight, 0])
				.domain([0, d3.max(nitroData)]);

			xAxis = d3.svg.axis()
				.scale(scaleX)
				.orient("bottom")
				.tickFormat(d3.time.format("%b %e"));

			yAxis = d3.svg.axis()
				.scale(scaleY)
				.orient("left")
				.ticks(6);

			line = d3.svg.line()
				.x( function(d, i) { return scaleX(createDate(i)); })
				.y( function(d) { return scaleY(d); });

			tip = d3.tip()
				.attr("class", "tip")
				.offset([-50, 0])
				.direction("s")
				.html(function(d, i) {

					var type = this.classList.contains("nitrogen");
					var tipTitle, 
					  tipDateFormat = d3.time.format("%e %b, %Y"), 
					  tipDate = tipDateFormat(createDate(i));

					if (type === true) {
					  tipTitle = "Pro available Nitrogen";
					}
					else {
					  tipTitle = "Crop Uptake";
					}

					return tipTitle + " of " + d + " lbs/ac on " + tipDate;
				});
		};

		this.render = function() {
			this.createContainer();
		};

		this.graphRenderer = function() {
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
				.x( function(d, i) { return scaleX(d); })
				.y0(containerHeight)
				.y1(0);

			massageEventDates();

			var i = 0,
				className;

			for (i; i < eventsData.events.length; i++) {
				className = "eventId_" + eventsData.events[i].id + " keyEvent keyEvent--" + i;

				this.svg.append("path")
				.datum(eventsData.events[i].metadata.dates)
				.classed(className, true)
				.attr("d", area);
			}
			
		};

		function formatDate(dateString) {
			var dateObj = d3.time.format("%Y-%m-%d").parse(dateString);
			return dateObj;
		}

		function createDate(i) {
			var newDate = new Date(startDate);
			newDate.setDate(newDate.getDate() + i);
			return newDate;	
		}

		function massageEventDates() {
			var i = 0,
				cleanedEvents = eventsData.events;

			for (i; i < cleanedEvents.length; i++) {
				var dateArr = [],
					eventStartDate = cleanedEvents[i].metadata.start_date,
					eventEndDate = cleanedEvents[i].metadata.end_date,
					eventStartIndex = cleanedEvents[i].metadata.start_day,
					eventEndIndex = cleanedEvents[i].metadata.end_day;

				if (eventStartDate !== undefined) {
					dateArr.push(formatDate(eventStartDate));
				}
				if (eventEndDate !== undefined) {
					dateArr.push(formatDate(eventEndDate));
				}
				if (eventStartIndex !== undefined) {
					dateArr.push(createDate(eventStartIndex));
				}
				if (eventEndIndex !== undefined) {
					dateArr.push(createDate(eventEndIndex));
				}

				cleanedEvents[i].metadata.dates = dateArr;
			}
		}

	};

// Render App
	var NitrogenApp = function() {

		var nitrogenGraph = new Graph();
			
		this.init = function() {
			getData();
		};

		function getData() {
			var nData = new Data();
			var converted = 'http://localhost:5000/converted';
			var events = 'http://localhost:5000/events';

			nData.init(converted).then(function(response) {
			  fetchedData = JSON.parse(response);
			  renderGraph();
			}, function(error) {
			  console.error("Failed!", error);
			});

			nData.init(events).then(function(response) {
				eventsData = JSON.parse(response);
				renderEvents();

			}, function(error) {
				console.error("Failed!", error);
			});
		}

		function renderGraph() {
			nitrogenGraph.init(fetchedData);
		}

		function renderEvents() {
			nitrogenGraph.renderKeyEvents();
			nitrogenGraph.graphRenderer();
			renderEventDescriptions();
		}

		function renderEventDescriptions () {
			var mergedEvents = {
				events: eventsData.events,
				descriptions: keyEventDescriptions.descriptions
			};

			var listWrapper = document.querySelector(".recommend ul");
				
			for (var i = 0; i < mergedEvents.events.length; i++) {
				var elem = document.createElement("li");

				
				var idValue = mergedEvents.events[i].id;
				var text = "<p>"
					+ mergedEvents.descriptions[idValue]["short-desc"]
					+ "</p>"
					+ "<p>" + mergedEvents.descriptions[idValue]["long-desc"] + "</p>";

				listWrapper.appendChild(elem);
				elem.className = "recommend__item js_recItem";
				elem.setAttribute("data-target", "keyEvent--" + i);
				elem.innerHTML = text;
				
				elem.addEventListener("click", learnMore);
			}
		}

		function learnMore(e) {
			var indicators = [].slice.call(document.querySelectorAll(".keyEvent"));

			indicators.forEach( function(item) {
				item.classList.remove("visible");

			});

			var target = [].slice.call(document.querySelectorAll("." + e.currentTarget.dataset.target));

			target.forEach( function(item) {
					item.classList.toggle("visible");
				});
		}
	};

	// Initialize
	var nitrogenapp = new NitrogenApp();
	nitrogenapp.init();
        
}());
