var hCountry = Arg("country");

window.onload = function() {

    Tabletop.init({
				key: '1vbKj-KBH4ZAeJu0oSEJXyRhMm-0JdQeqB1sE_2Gg8Hw',
				simpleSheet: true,
				callback: function(data, tabletop) {

						var countries = data.map(function(el) {
										return el.Country;
								}),
								codes = data.map(function(el) {
										return el.sovereingt.toLowerCase();
								}),
								questions = d3.keys(data[0]).filter(function(el) {
										return el != 'Country' && el != 'sovereingt';
								});

						var width = 480,
								height = 480,
								maxRadius = d3.min([width, height]) / 2,
								minRadius = maxRadius / 10,
								stepRadius = (maxRadius - minRadius) / (questions.length + 1),
								padRadius = 4,
								cornerRadius = 2;

						var color = d3.scale.ordinal().range(["green", "grey", "red"]).domain(["Y", "N.A.", "N"]);

						var sunContainer = d3.select("#sunburst");

						sunContainer.select("i").remove();

						var sunSvg = sunContainer.append("svg")
								.attr("width", width)
								.attr("height", height/2+minRadius)
								.append("g")
								.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

						sunSvg.append("image")
								.attr("xlink:href", "images/favicon.gif")
								.attr("x", -minRadius + padRadius / 2)
								.attr("y", -minRadius + padRadius / 2)
								.attr("width", minRadius * 2 - padRadius)
								.attr("height", minRadius * 2 - padRadius);

						sunSvg.selectAll("g.pie")
								.data(questions)
								.enter()
								.append("g")
								.attr("class", "pie")
								.each(function(q, i) {

										var arc = d3.svg.arc()
												.outerRadius(minRadius + (i + 1) * stepRadius - padRadius / 2)
												.innerRadius(minRadius + i * stepRadius + padRadius / 2)
												.cornerRadius(cornerRadius);

										var pieData = countries.map(function(el, i) {
												return {
														country: el,
														code: codes[i],
														value: 1,
														question: q,
														answer: data[i][q]
												};
										});

										var pie = d3.layout.pie()
												.sort(function(a, b) {
														return d3.ascending(a.code, b.code);
												})
												.value(function(d) {
														return d.value;
												})
												.startAngle(-Math.PI/2)
												.endAngle(Math.PI/2)
												.padAngle(0.02);

										var g = d3.select(this).selectAll(".arc")
												.data(pie(pieData))
												.enter().append("g")
												.attr("class", function(d) {
														return d.data.code;
												})
												.classed("arc", true)
												.classed("highlight", function(d, i) {
														return hCountry && d.data.code === hCountry.toLowerCase();
												});

										g.append("path")
												.attr("d", arc)
												.style("fill", function(d) {
														return color(d.data.answer);
												});

										g.append("title")
												.text(function(d, i) {
														return d.data.country + ": " + d.data.question + " -> " + d.data.answer;
												});

								});

						// Label dei paesi
						var arc = d3.svg.arc()
								.outerRadius(maxRadius)
								.innerRadius(maxRadius - stepRadius + padRadius / 2);

						var pieData = countries.map(function(el, i) {
								return {
										country: el,
										value: 1,
										code: codes[i]
								};
						});

						var pie = d3.layout.pie()
								.sort(function(a, b) {
										return d3.ascending(a.code, b.code);
								})
								.value(function(d) {
										return d.value;
								})
								.startAngle(-Math.PI/2)
								.endAngle(Math.PI/2);
								
						var g = sunSvg.append("g")
								.attr("class", "pie")
								.selectAll(".arc")
								.data(pie(pieData))
								.enter().append("g")
								.attr("class", function(d) {
										return d.data.code;
								})
								.classed("arc", true)
								.classed("label", true);

						var path = g.append("path")
								.attr("d", arc)
								.attr("id", function(d, i) {
										return "path" + i;
								});

						var label = g.append("text")
								.attr("x", 6)
								.attr("dy", 15)

						label.append("textPath")
								.attr("xlink:href", function(d, i) {
										return "#path" + i;
								})
								.text(function(d) {
										return d.data.code.toUpperCase();
								});

						label.append("title").text(function(d, i) {
								return d.data.country;
						});

						// Mappa dell'Europa
						d3.json("geo/eu.topojson", function(err, geo) {

								//imposto la proiezione della mappa
								var projection = d3.geo.azimuthalEqualArea()
										.rotate([-9, 0, 0])
										.scale(450)
										.center([5, 42])
										.translate([width / 2, height / 4]);

								//imposto la formula per calcolare il path delle geometrie
								var path = d3.geo.path().projection(projection);

								var mapContainer = d3.select("#map");

								mapContainer.select("i").remove();

								var mapSvg = mapContainer.append("svg")
										.attr("width", width)
										.attr("height", height / 2)
										.append("g")
										.attr("transform", "translate(0,50)");
								
								mapSvg.selectAll("path.country")
										.data(topojson.feature(geo, geo.objects.europe).features)
										.enter().append("path")
										.attr("class", function(d) {
												return codes.indexOf(d.properties.iso_a3.toLowerCase()) > -1 ? "active" : "inactive";
										})
										.classed("country", true)
										.attr("d", path)
										.on("mouseover", function(d,i) {
												sunSvg.selectAll(".arc."+d.properties.iso_a3.toLowerCase()).classed("highlight",true);
										})
										.on("mouseout", function(d,i) {
												sunSvg.selectAll(".arc."+d.properties.iso_a3.toLowerCase()).classed("highlight",false);
										});

								console.log(geo);

						});

				}
    });
};