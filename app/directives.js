app.directive('mathjax',function(){
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      // MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem[0]]);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub,elem[0]]);
    }
  };
});

app.directive('interactiveChart', function () {
  return {
    restrict: 'E',
    scope: {
      "data": "=", 
      "fitobj": "=",
    },
    link: function (scope, elem, attrs) {
      var data = d3.zip(scope.data[0], scope.data[1], scope.data[2]);
      var par0 = [1,1,1];

      var margin = {top: 20, right: 15, bottom: 60, left: 60},
          width = 1000 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
      // data = d3.range(5000).map(function() { return [Math.random() * width, Math.random() * width]; });

      var xscale = d3.scale.linear()
                .range([0, width])
                .domain([ d3.min(data, function(d) { return d[0]; }), 
                          d3.max(data, function(d) { return d[0]; }) ]);
            
      var yscale = d3.scale.linear()
          .range([height, 0])
          .domain([ d3.min(data, function(d) { return d[1]; }),
                    d3.max(data, function(d) { return d[1]; }) ]);

      var quadtree = d3.geom.quadtree()
          .extent([[-1, -1], [width + 1, height + 1]])
          (data);

      var brush = d3.svg.brush()
          .x(xscale)
          .y(yscale)
          .on("brush", brushed)
          .on('brushend', brushend);

      var svg = d3.select(elem[0]).append("svg")
          .attr("width", width)
          .attr("height", height);


      var main = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'main');   
      
      var xAxis = d3.svg.axis()
        .scale(xscale)
        .orient('bottom');


      main.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .attr('class', 'main axis date')
        .call(xAxis);

           // draw the y axis
      var yAxis = d3.svg.axis()
        .scale(yscale)
        .orient('left');

      main.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'main axis date')
        .call(yAxis);

      var point = main.selectAll(".point")
          .data(data)
        .enter().append("circle")
          .attr("class", "point")
          .attr("cx", function(d) { return xscale(d[0]); })
          .attr("cy", function(d) { return yscale(d[1]); })
          .attr("r", 4);

      main.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);

      var line = d3.svg.line()
        .x(function(d) { return xscale(d[0]); })
        .y(function(d) { return yscale(d[1]); });

      function brushed() {
        var extent = brush.extent();
        point.each(function(d) { d.selected = false; });
        search(quadtree, extent[0][0], extent[0][1], extent[1][0], extent[1][1]);
        point.classed("selected", function(d) { return d.selected; });
        var selected = point.filter(function (d) {return d.selected;}).data();
        var tmp = d3.transpose(selected);
        if (selected.length > 3) {
          fit(tmp);
        }
        // delete fitobj;
      }

      function fit (data) {
        par0 = [1, data[1][0], 1];
        var fitobj  = jsfit.fit(jsfit.models.exponential, data, par0);
        scope.fitobj = fitobj;
        var tmp = d3.transpose(scope.data);
        var lineData = tmp.map(function (d) {
          return [d[0], jsfit.models.exponential(d[0], fitobj.params)];
        });
        d3.selectAll("path.best-fit-line").remove();
        main.append("path")
          .attr("d", line(lineData))
          .attr("class", "best-fit-line");
        scope.$apply();
      }

      function brushend() {
        if (!d3.event.sourceEvent) return; // only transition after input
        // console.log(point.filter(function (d) {return d.selected;}));
      }

      // Find the nodes within the specified rectangle.
      function search(quadtree, x0, y0, x3, y3) {
        quadtree.visit(function(node, x1, y1, x2, y2) {
          var p = node.point;
          if (p) p.selected = (p[0] >= x0) && (p[0] < x3) && (p[1] >= y0) && (p[1] < y3);
          return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
        });
      }
    }
  };
});