var app = angular.module('app', ['ui.router', 'hljs'])

app.run(function($rootScope) {
  $rootScope.$on('$routeChangeStart', MathJax.Hub.Queue(["Typeset",MathJax.Hub]));
});

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");
  $stateProvider
    .state('main', {
      url: "/",
      templateUrl: "app/views/main.html", 
      controller: function($scope) {
        // $scope.items=[1,2,3];
      }
    })

    .state('examples', {
      abstract: true, 
      url: "/examples", 
      template: '<div ui-view>'
    })
      .state('examples.example1', {
        url: '/1',
        templateUrl: "app/views/linearExample.html",
        controller: 'linearExCtrl'
      })
      .state('examples.example2', {
        url: '/2',
        templateUrl: "app/views/exponential1.html",
        controller: 'example1Ctrl'
      })
      .state('examples.example3', {
        url: '/3',
        templateUrl: "app/views/example2.html",
        controller: 'example2Ctrl'
      })
      .state('examples.example4', {
        url: '/4', 
        templateUrl: "app/views/interactive.html", 
        controller: 'interactiveCtrl'
      })
    .state('readme',  {
      'url': '/readme', 
      templateUrl: 'app/views/readme.html'
    });
});







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
                    .showXAxis(true)  //Show the x-axis
      ;
      if (options.yRange) {
        chart.forceY(options.yRange);
      }

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





var generatePointsData = function(data, model, p0, params) {
  var points = [],
      line = [], 
      initial = [],
      xvals, 
      yvals;

  xvals = data[0];
  yvals = data[1];

  for (var i = 0; i < data[0].length; i++) {
    points.push({x:xvals[i], y: yvals[i]});
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







