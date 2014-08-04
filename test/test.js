var app = angular.module('app', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");
  $stateProvider
    .state('main', {
      url: "/",
      templateUrl: "views/main.html", 
      controller: function($scope) {
        console.log("Hello")
        $scope.items=[1,2,3];
      }
    })

    .state('examples', {
      abstract: true, 
      url: "/examples", 
      template: '<div ui-view>'
    })
      .state('examples.example1', {
        url: '/example1',
        templateUrl: "views/exponential1.html",
        controller: 'fixedExponentialCtrl'
      });


});

app.controller('fixedExponentialCtrl', function($scope) {
  p0 = [10.0, 1000.0, 0.5];
  var npoints = 300;
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return exponential(d, p0);});
  noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.2), 0.1), 1.0);
  yvals = numeric.mul(clean, noise);
  weights = yvals.map(function (d) {return d/10;});

  // console.log(weights)
  data2 = [ 
           xvals, 
           yvals,
           weights
          ];

  $scope.p0 = [ {value:400.0}, {value:yvals[0]}, {value:1.0} ];
  $scope.parInfo = [{'name': 'C', 'fixed':false}, {'name': 'A', 'fixed':false}, {'name': 'k'}];
  par0 = $scope.p0.map(function(p) {return p.value});
  var minimizer = new Minimizer(exponential, data2, par0, {'debug': false, parInfo: $scope.parInfo });

  $scope.fit = function() {
    var start = new Date().getTime();
    $scope.fitobj = minimizer.fit();
    var end = new Date().getTime();
    $scope.fitTime = end - start;
    par0 = $scope.p0.map(function(p) {return p.value});
    createChart({"data":generatePointsData(data2, exponential, par0, $scope.fitobj.params), element:"#chart2"});
  };

  $scope.fit();

});

// app.controller('fixedSineCtrl', function($scope) {

//   p0 = [0.0, 10.0, 1.0];
//   var npoints = 100;
//   xvals = numeric.linspace(0,10, npoints);
//   clean = xvals.map(function(d, i){return sine(d, p0);});
//   noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.1), 0.05), 1.0);
//   yvals = numeric.mul(clean, noise);
//   data3 = [ 
//            xvals, 
//            yvals,
//           ];
//   var t1 = new Date()
//   p0 = [4.0, 4.0, 1.3];
//   var parInfo = [{name: 'C', fixed: true}, {'name': 'A', fixed:false}, {'name': 'w', fixed:false}];
//   var minimizer = new Minimizer(sine, data3, p0, {'debug': false, parInfo:parInfo});
//   var fit3 = minimizer.fit();
//   console.log(fit3);
//   var t2 = new Date();
//   console.log(t2-t1)

//   createChart({"data":generatePointsData(data3, sine, p0, fit3.params), element:"#chart3"});
// });




function createChart (options) {
  var data = options.data;
  var element = options.element;

  var chartMaker = function() {
    nv.addGraph(function() {
      var chart = nv.models.lineChart()
                    .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                    .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                    .transitionDuration(350)  //how fast do you want the lines to transition?
                    .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                    .showYAxis(true)        //Show the y-axis
                    .showXAxis(true)        //Show the x-axis
      ;

      chart.xAxis     //Chart x-axis settings
          .tickFormat(d3.format(',r'));

      chart.yAxis     //Chart y-axis settings
          .tickFormat(d3.format('.02f'));

      d3.select(element + " svg")    //Select the <svg> element you want to render the chart in.   
          .datum(data)         //Populate the <svg> element with chart data...
          .call(chart);          //Finally, render the chart!

      //Update the chart when window resizes.
      nv.utils.windowResize(function() { chart.update(); });
      return chart;
    });
  };
  var ch = chartMaker();
  return ch;
}


function exponential(x, params) {
  var C = params[0], 
      A = params[1], 
      k = params[2];
  return (C + A * Math.exp(-k * x));
}

function flat(x, params) {
  var k = params[0];
  return k;
}

function linear(x, params) {
  var m = params[0], 
      b = params[1];
  return (m*x + b);
}

function decay(x, params) {
  A = params[0];
  k = params[1];
  return A + (Math.sin(3*x));
}

function sine(x, params) {
  C = params[0];
  A = params[1];
  w = params[2];
  return C + A * Math.sin(w*x);
}


var generatePointsData = function(data, model, p0, params) {
  var points = [],
      line = [], 
      initial = [],
      xvals, 
      yvals;

  xvals = data[0];
  yvals = data[1];

  for (var i = 0; i < data[0].length; i++) {
    points.push({x:xvals[i] , y: yvals[i]});
    line.push({x: xvals[i], y: model(xvals[i], params)});
    initial.push({x: xvals[i], y: model(xvals[i], p0)});
  }

  return [
    {
      values: points,
      key: 'Data',
      color: '#ff7f0e'
    },
    {
      values: line,
      key: 'Fit',
      color: '#2ca02c'
    }, 
    {
      values: initial,
      key: 'Initial',
      color: 'steelBlue'
    }
  ];
};




// var data = [
//         [1, 2, 3, 4, 5, 6, 7, 8],
//         [8.3, 11.0, 14.7, 19.7, 26.7, 35.2, 44.4, 55.9]
//        ];
// var p0 = [1.0, 1.0, 0.2];


// var minimizer = new Minimizer(exponential, data, p0, {'debug': false, parInfo: [{'name': 'C'}, {'name': 'A'}, {'name': 'k'}] });
// var start = new Date().getTime();
// var fit = minimizer.fit();
// console.log(fit)
// var end = new Date().getTime();
// var time = end - start;

// console.log("time", time)

// createChart({"data":generatePointsData(data, exponential, p0, fit.params), element:"#chart1"});



//
// Decaying exponential
//







