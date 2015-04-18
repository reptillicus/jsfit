app.controller('linearExCtrl', function($scope) {
  p0 = [3.00, 10.0];
  var npoints = 300;
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return jsfit.models.linear(d, p0);});
  noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.2), 0.1), 1.0);
  yvals = numeric.mul(clean, noise);
  // console.log(weights)
  $scope.data = [ 
           xvals, 
           yvals,
          ];
  $scope.xvals = $scope.data[0];
  $scope.yvals = $scope.data[1];

  $scope.p0 = [ {value:1.0}, {value:1.0}];
  $scope.parInfo = [{'name': 'm', 'fixed':false}, {'name': 'b', 'fixed':false}];

  $scope.fit = function() {
    var par0 = $scope.p0.map(function(p) {return p.value;});
    var opts = {'debug': false, parInfo: $scope.parInfo };
    $scope.fitobj = jsfit.fit(jsfit.models.linear, $scope.data, par0, opts);
    createChart({"data":generatePointsData($scope.data, jsfit.models.linear, par0, $scope.fitobj.params), element:"#chart2"});
  };

  $scope.fit();

});

app.controller('example1Ctrl', function($scope) {
  p0 = [10.0, 1000.0, 0.5];
  var npoints = 300;
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return jsfit.models.exponential(d, p0);});
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
    $scope.fitobj = jsfit.fit(jsfit.models.exponential, $scope.data, par0, {'debug': false, parInfo: $scope.parInfo });
    console.log($scope.fitobj)
    createChart({"data":generatePointsData($scope.data, jsfit.models.exponential, par0, $scope.fitobj.params), element:"#chart2"});
  };

  $scope.fit();

});

app.controller('example2Ctrl', function($scope) {

  p0 = [20, 100.0, 5.0, 1.0];
  var npoints = 200;
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return jsfit.models.gaussian(d, p0);});
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
  $scope.parInfo = [{'name': 'C', 'fixed':true}, {'name': 'A', 'fixed':false}, {'name': 'mu'}, {'name':'sigma', 'fixed':false }];
  

  $scope.fit = function() {
    par0 = $scope.p0.map(function(p) {return p.value;});
    $scope.fitobj  = jsfit.fit(jsfit.models.gaussian, $scope.data, par0, {'debug': false, parInfo: $scope.parInfo });
    createChart({"data":generatePointsData($scope.data, jsfit.models.gaussian, par0, $scope.fitobj.params), element:"#chart2", yRange:[0, 150]});
  };

  $scope.fit();
});


app.controller('interactiveCtrl', function ($scope) {
  npoints = 400;
  p0 = [10.0, 1000.0, 0.5];
  xvals = numeric.linspace(0,10, npoints);
  clean = xvals.map(function(d, i){return jsfit.models.exponential(d, p0);});
  noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.2), 0.1), 1.0);
  yvals = numeric.mul(clean, noise);
  weights = yvals.map(function (d) {return d/40;});

  $scope.data = [ 
           xvals, 
           yvals,
           weights
          ];


});


app.controller('otherExamplesCtrl', function ($scope) {
  
  function model (x, params) {
    r = Math.sqrt( Math.pow((x[0] - params[0]), 2) + 
                   Math.pow((x[1] - params[1]), 2) 
                  );
    return r; 
  }
  $scope.yvals = [515.9089066879927 ,
           272.7673000929547,
           474.09070862019644,
           350.202798389733,
           440.9104217411968,
           262.60616900598507,
           51.40038910358559,
           152.190669884852];

  $scope.xvals = [ [10, 10],
           [480, 10],
           [10, 460],
           [240, 0],
           [10, 240],
           [240, 440],
           [480, 240],
           [480,430]];

  $scope.data = [$scope.xvals, $scope.yvals];
  $scope.par0 = [numeric.sum($scope.xvals.map(function(d) {return d[1];})) / $scope.xvals.length, 
                 numeric.sum($scope.xvals.map(function(d) {return d[1];})) / $scope.xvals.length
                ];
  $scope.fitobj  = jsfit.fit(model, $scope.data, $scope.par0, {'debug': true });
  console.log($scope.fitobj) 
  // var canvas = document.getElementById('viewport');
  // console.log(canvas)
  // var context = canvas.getContext('2d');
  // var base_image = new Image();
  // base_image.src = 'app/images/qso.png';
  // base_image.onload = function(){
  //   context.drawImage(base_image, 0, 0, base_image.width, base_image.height);
  // };

});
