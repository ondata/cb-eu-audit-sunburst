window.onload = function() {

    var hCountry = Arg("country");

    var width = 640,
        height = 640,
        maxRadius = d3.min([width, height]) / 2,
        minRadius = maxRadius / 10,
        padRadius = 4,
        cornerRadius = 2,
        countries, codes, questions,
        sunSvg, mapSvg;

    // Contenitori delle viz
    var sunContainer = d3.select("#sunburst"),
        mapContainer = d3.select("#map"),
        legendContainer = d3.select("#legend");

    //imposto la proiezione della mappa
    var projection = d3.geo.azimuthalEqualArea()
        .rotate([-9, 0, 0])
        .scale(450)
        .center([5, 42])
        .translate([width / 4, height / 3]);

    //imposto la formula per calcolare il path delle geometrie
    var path = d3.geo.path().projection(projection);

    Tabletop.init({
        key: '1vbKj-KBH4ZAeJu0oSEJXyRhMm-0JdQeqB1sE_2Gg8Hw',
        simpleSheet: true,
        callback: function(data, tabletop) {

            countries = data.map(function(el) {
                return el.Country;
            });
            codes = data.map(function(el) {
                return el.ISO3166.toLowerCase();
            });
            questions = d3.keys(data[0]).filter(function(el) {
                return el != 'Country' && el != 'sovereingt' && el != 'ISO3166';
            });

            var stepRadius = (maxRadius - minRadius) / (questions.length + 1),
                color = d3.scale.ordinal().range(["green", "grey", "red"]).domain(["Y", "N.A.", "N"]);

            sunContainer.select("i").remove();
            
            if (mapSvg) {
                mapSvg.selectAll("path.country")
                    .classed("active", function(d) {
                        return codes && codes.indexOf(d.properties.iso_a3.toLowerCase()) > -1;
                    });
            }
            
            sunSvg = sunContainer.append("svg")
                .attr("width", width)
                .attr("height", height / 2 + minRadius)
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
                        .startAngle(-Math.PI / 2)
                        .endAngle(Math.PI / 2)
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
                .startAngle(-Math.PI / 2)
                .endAngle(Math.PI / 2);

            var g = sunSvg.append("g")
                .attr("class", "pie")
                .selectAll(".arc")
                .data(pie(pieData))
                .enter().append("g")
                .attr("class", function(d) {
                    return d.data.code;
                })
                .classed("arc", true)
                .classed("label", true)
                .on("mouseover", function(d,i) {
                    sunSvg.selectAll(".arc." + d.data.code).classed("highlight", true);
                    if (mapSvg) mapSvg.selectAll(".country." + d.data.code).classed("highlight", true);
                })
                .on("mouseout", function(d,i) {
                    sunSvg.selectAll(".arc." + d.data.code).classed("highlight", false);
                    if (mapSvg) mapSvg.selectAll(".country." + d.data.code).classed("highlight", false);
                });


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
            
            // Legenda
            legendContainer.select("i").remove();

            legendContainer
                .style("height", (height / 2 - minRadius) + "px")
                .append("p")
                .attr("class", "questions")
                .selectAll("span.question")
                .data(questions.slice().reverse())
                .enter().append("span")
                .attr("class", "question")
                .style({
                    "width": (stepRadius - padRadius - 4) + "px",
                    "margin": padRadius/2 + "px"
                })
                .style("height", function(d,i) {
                   return (10 + questions.length - i) + "px";
                })
                .on("mouseover", function(d,i) {
                    legendContainer.select("#qtext").text(d);
                })
                .on("mouseout", function(d,i) {
                    legendContainer.select("#qtext").text("");
                });

            legendContainer
                .append("p")
                .attr("id", "qtext");
                
            legendContainer
                .append("p")
                .attr("class", "answers")
                .selectAll("span.answer")
                .data(color.domain())
                .enter().append("span")
                .attr("class", "answer")
                .style({
                    "width": ((maxRadius - minRadius)/4 - padRadius - 4) + "px",
                    "margin": padRadius/2 + "px"
                })
                .style("border-color", function(d,i) {
                    return color(d);
                })
                .text(function(d,i) {
                    return d;
                });
        }
    });
    
    // Mappa dell'Europa
    d3.json("geo/eu.topojson", function(err, geo) {

        mapContainer.select("i").remove();

        mapSvg = mapContainer.append("svg")
            .attr("width", width / 2)
            .attr("height", height / 2 - minRadius)
            .append("g");

        mapSvg.selectAll("path.country")
            .data(topojson.feature(geo, geo.objects.europe).features)
            .enter().append("path")
            .attr("class", function(d) {
                return "country " + d.properties.iso_a3.toLowerCase();
            })
            .classed("active", function(d) {
                return codes && codes.indexOf(d.properties.iso_a3.toLowerCase()) > -1;
            })
            .attr("d", path)
            .on("mouseover", function(d, i) {
                if (sunSvg) sunSvg.selectAll(".arc." + d.properties.iso_a3.toLowerCase()).classed("highlight", true);
                d3.select(this).classed("highlight", true);
            })
            .on("mouseout", function(d, i) {
                if (sunSvg) sunSvg.selectAll(".arc." + d.properties.iso_a3.toLowerCase()).classed("highlight", false);
                d3.select(this).classed("highlight", false);
            });

    });

};
