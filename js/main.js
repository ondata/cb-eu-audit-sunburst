window.onload = function() {
    
    // Funzione accessoria per la traduzione delle stringhe basata sul locale del browser
    var t = function(s) {
        return s.toLocaleString();
    };

    var ids = [];
    d3.select("body")
        .selectAll(".translatable")
        .each(function() { 
            var id = d3.select(this).attr("id"); 
            if (id) ids.push(id); 
        });
    
    // Traduzione di tutte le stringhe statiche della pagina
    document.title = t("%page.title");
    ids.forEach(function(id) {
        d3.select("#"+id).html(t("%"+id.replace("-",".")));
    });

    // Gestione dei parametri GET passati nell'URL
    var getCountry = Arg("country"),
        getLanguage = Arg("lang"), // Da uniformare i codici con l10n
        getNamedColors = Arg("ncolors"),
        getHexColors = Arg("hcolors");

    // Variabili globali per le visualizzazioni
    var width = 640,
        height = 640,
        maxRadius = d3.min([width, height]) / 2,
        minRadius = maxRadius / 10,
        padRadius = 4,
        cornerRadius = 2,
        countries, codes, labels, questions,
        sunSvg, mapSvg;

    // Scala dei colori per le risposte
    var colors = getNamedColors || getHexColors ? (getHexColors ? getHexColors.split(',').map(function(el) { return '#'+el; }) : getNamedColors.split(',')) : ["red","white","gray"],
        color = d3.scale.ordinal().range(colors).domain(["Y", "N.A.", "N"]);

    // Contenitori delle viz
    var sunContainer = d3.select("#sunburst"),
        mapContainer = d3.select("#map"),
        legendContainer = d3.select("#legend");

    // Proiezione della mappa
    var projection = d3.geo.azimuthalEqualArea()
        .rotate([-9, 0, 0])
        .scale(450)
        .center([5, 42])
        .translate([width / 4, height / 3]);

    // Calcolo del path delle geometrie
    var path = d3.geo.path().projection(projection);

    // Richiesta dei dati al google sheet
    Tabletop.init({
        key: '1vbKj-KBH4ZAeJu0oSEJXyRhMm-0JdQeqB1sE_2Gg8Hw',
        simpleSheet: false, // Ottengo un oggetto con tutti i fogli
        callback: function(data, t) {
            
            // I fogli di cui è composto il documento
            var data = t.sheets("New Audit").all(),
                meta = t.sheets("Meta").all(),
                translations = t.sheets("Translations").all();
                
            // Oggetto accessorio per la traduzione delle domande.
            // Probabilmente meglio che sia una funzione come t()
            var q = {};
            translations.forEach(function(el) { q[el["Language"]] = el; });

            // Array accessori con alcune informazioni utili
            countries = data.map(function(el) {
                return el["country"];
            });
            codes = data.map(function(el) {
                return el["iso3166-1a3"].toLowerCase();
            });
            labels = data.map(function(el) {
                return el["iso3166-1a2"].toUpperCase();
            });
            questions = d3.keys(data[0]).filter(function(el) {
                // return el.slice(0,1) === 'q';
                return el != 'country' && el != 'sovereingt' && el != 'iso3166-1a3' && el != 'iso3166-1a2';
            });

            var stepRadius = (maxRadius - minRadius) / (questions.length + 1);

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
                .each(function(dq, qi) {

                    var arc = d3.svg.arc()
                        .outerRadius(minRadius + (qi + 1) * stepRadius - padRadius / 2)
                        .innerRadius(minRadius + qi * stepRadius + padRadius / 2)
                        .cornerRadius(cornerRadius);

                    var pieData = countries.map(function(dc, ci) {
                        // Warning: questions and answers match by position, not by ID...
                        return {
                            country: dc,
                            code: codes[ci],
                            label: labels[ci],
                            value: 1,
                            question: getLanguage || getCountry ? q[getLanguage || getCountry][dq] || dq : dq,
                            answer: data[ci][dq]
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
                            return d.data.code + " " + "q"+(qi+1);
                        })
                        .classed("arc", true)
                        .classed("sticky", function(d) {
                            return getCountry && d.data.code === getCountry.toLowerCase();
                        });

                    g.append("path")
                        .attr("d", arc)
                        .style("fill", function(d) {
                            return color(d.data.answer);
                        });

                    g.append("title")
                        .text(function(d) {
                            return d.data.country + ": " + d.data.question + " -> " + d.data.answer;
                        });

                });

            // Label dei paesi
            var arc = d3.svg.arc()
                .outerRadius(maxRadius)
                .innerRadius(maxRadius - stepRadius + padRadius / 2);

            var pieData = countries.map(function(dc, ci) {
                return {
                    country: dc,
                    value: 1,
                    code: codes[ci],
                    label: labels[ci]
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
                .classed("sticky", function(d) {
                    return getCountry && d.data.code === getCountry.toLowerCase();
                })
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
                    return d.data.label;
                });

            label.append("title").text(function(d) {
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
                .style("height", function(dq,qi) {
                   return (10 + questions.length - qi) + "px";
                })
                .on("mouseover", function(dq) {
                    legendContainer.select("#qtext").text(getLanguage || getCountry ? q[getLanguage || getCountry][dq] || dq : dq);
                })
                .on("mouseout", function() {
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

        var features = mapSvg.selectAll("path.country")
            .data(topojson.feature(geo, geo.objects.europe).features)
            .enter().append("path")
            .attr("class", function(d) {
                return "country " + d.properties.iso_a3.toLowerCase();
            })
            .classed("active", function(d) {
                return codes && codes.indexOf(d.properties.iso_a3.toLowerCase()) > -1;
            })
            .classed("sticky", function(d) {
                return getCountry && d.properties.iso_a3.toLowerCase() === getCountry.toLowerCase();
            })
            .attr("d", path)
            .on("mouseover", function(d) {
                if (sunSvg) sunSvg.selectAll(".arc." + d.properties.iso_a3.toLowerCase()).classed("highlight", true);
                d3.select(this).classed("highlight", true);
            })
            .on("mouseout", function(d) {
                if (sunSvg) sunSvg.selectAll(".arc." + d.properties.iso_a3.toLowerCase()).classed("highlight", false);
                d3.select(this).classed("highlight", false);
            });

        features.append("title")
            .text(function(d) {
                return d.properties.name;
            });

    });

};
