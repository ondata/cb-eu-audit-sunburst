var hCountry = Arg("country");

window.onload = function() {

  Tabletop.init({
    key: '1vbKj-KBH4ZAeJu0oSEJXyRhMm-0JdQeqB1sE_2Gg8Hw',
    simpleSheet: true,
    callback: function(data, tabletop) {

      var countries = data.map(function(el) { return el.Country; }),
          codes = data.map(function(el) { return el.sovereingt; }),
          questions = d3.keys(data[0]).filter(function(el) { return el != 'Country' && el != 'sovereingt'; });

      var width = 480,
          height = 480,
          maxRadius = d3.min([width, height]) / 2,
          minRadius = maxRadius / 10,
          stepRadius = (maxRadius - minRadius) / (questions.length+1);

      var color = d3.scale.ordinal().range(["green","grey","red"]).domain(["Y","N.A.","N"]);

      var container = d3.select("#sunburst");

      container.select("i").remove();

      var svg = container.append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      svg.selectAll("g.pie")
          .data(questions)
          .enter()
          .append("g")
          .attr("class", "pie")
          .each(function(q,i) {

            var arc = d3.svg.arc()
                        .outerRadius(minRadius + (i+1)*stepRadius)
                        .innerRadius(minRadius + i*stepRadius);

            var pieData = countries.map(function(el,i) { 
                            return { 
                              country: el, 
                              code: codes[i], 
                              value: 1, 
                              question: q, 
                              answer: data[i][q] 
                            }; 
                          });

            var pie = d3.layout.pie()
                        .sort(function(a,b) { return d3.ascending(a.code, b.code); })
                        .value(function(d) { return d.value; });

            var g = d3.select(this).selectAll(".arc")
                       .data(pie(pieData))
                       .enter().append("g")
                       .attr("class", function(d) {
                         return d.data.code.toLowerCase();
                       })
                       .classed("arc", true)
                       .classed("highlight", function(d,i) {
                         return hCountry && d.data.code.toLowerCase() === hCountry.toLowerCase();
                       });

            g.append("path")
             .attr("d", arc)
             .style("fill", function(d) { return color(d.data.answer); });
             
            g.append("title")
             .text(function(d,i) {
               return d.data.country + ": " + d.data.question + " -> " + d.data.answer;
             });

          });

      var arc = d3.svg.arc()
                  .outerRadius(maxRadius)
                  .innerRadius(maxRadius - stepRadius);

      var pieData = countries.map(function(el,i) { 
                      return { 
                        country: el, 
                        value: 1, 
                        code: codes[i] 
                      }; 
                    });

      var pie = d3.layout.pie()
                  .sort(function(a,b) { return d3.ascending(a.code, b.code); })
                  .value(function(d) { return d.value; });

      var g = svg.append("g")
                 .attr("class", "pie") 
                 .selectAll(".arc")
                 .data(pie(pieData))
                 .enter().append("g")
                 .attr("class", function(d) {
                   return d.data.code.toLowerCase();
                 })
                 .classed("arc", true)
                 .classed("label", true)
                 .classed("highlight", function(d,i) {
                   return hCountry && d.data.code.toLowerCase() === hCountry.toLowerCase();
                 });

      var path = g.append("path")
                  .attr("d", arc)
                  .attr("id", function(d,i) { return "path"+i; });

      var label = g.append("text")
                   .attr("x", 6)
                   .attr("dy", 15)
             
      label.append("textPath")
           .attr("xlink:href", function(d,i) { return "#path"+i; })
           .text(function(d) { return d.data.code; });
            
      label.append("title").text(function(d,i) { return d.data.country; });

    }

  });

};
