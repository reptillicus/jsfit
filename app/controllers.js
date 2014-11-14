app.controller('example1Ctrl', function($scope) {
  p0 = [10.0, 1000.0, 0.5];
  var npoints = 300;
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return exponential(d, p0);});
  noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.2), 0.1), 1.0);
  yvals = numeric.mul(clean, noise);
  weights = yvals.map(function (d) {return d/40;});

  // console.log(weights)
  $scope.data = [ 
           xvals, 
           yvals,
           weights
          ];
  $scope.xvals = $scope.data[0];
  $scope.yvals = $scope.data[1];
  $scope.weights = $scope.data[2];

  $scope.p0 = [ {value:400.0}, {value:yvals[0]}, {value:1.0} ];
  $scope.parInfo = [{'name': 'C', 'fixed':false}, {'name': 'A', 'fixed':false}, {'name': 'k'}];

  $scope.fit = function() {
    var par0 = $scope.p0.map(function(p) {return p.value;});
    var minimizer = new Minimizer(exponential, $scope.data, par0, {'debug': false, parInfo: $scope.parInfo });
    $scope.fitobj = minimizer.fit();
    createChart({"data":generatePointsData($scope.data, exponential, par0, $scope.fitobj.params), element:"#chart2"});
  };

  $scope.fit();

});

app.controller('example2Ctrl', function($scope) {

  p0 = [20, 100.0, 5.0, 1.0];
  var npoints = 200;
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return gaussian(d, p0);});
  noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.1), 0.05), 1.0);
  yvals = numeric.mul(clean, noise);
  // console.log(weights)
  $scope.data = [ 
           xvals, 
           yvals
          ];
  $scope.xvals = $scope.data[0];
  $scope.yvals = $scope.data[1];
  // $scope.weights = $scope.data[2];

  $scope.p0 = [ {value:20.0}, {value:80.0}, {value:4.3}, {value:0.5} ];
  $scope.parInfo = [{'name': 'C', 'fixed':false}, {'name': 'A', 'fixed':false}, {'name': 'mu'}, {'name':'sigma', 'fixed':false }];
  

  $scope.fit = function() {
    par0 = $scope.p0.map(function(p) {return p.value});
    var minimizer = new Minimizer(gaussian, $scope.data, par0, {'debug': false, parInfo: $scope.parInfo });
    $scope.fitobj = minimizer.fit();
    createChart({"data":generatePointsData($scope.data, gaussian, par0, $scope.fitobj.params), element:"#chart2"});
  };

  $scope.fit();
});


app.controller('interactiveCtrl', function ($scope) {
  npoints = 400;
  p0 = [10.0, 1000.0, 0.5];
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return exponential(d, p0);});
  noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.2), 0.1), 1.0);
  yvals = numeric.mul(clean, noise);
  weights = yvals.map(function (d) {return d/40;});

  $scope.data = [ 
           xvals, 
           yvals,
           weights
          ];


});
