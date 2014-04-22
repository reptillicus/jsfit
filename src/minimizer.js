function Minimizer(options) {
  var self = this;
  epsilon = 2.220446049250313e-16;
  residuals = null;
  initialParams = [];

  var defaultOptions = {
    maxIterations: 100
  };

  var fitterOptions = defaultOptions;
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) fitterOptions[key] = options[key];
    }
  }

  self.residuals = function(x, y, params) {
    var resid =[];
    for (var i=0; i<x.length; i++) {
      val = Math.pow(y[i] - self.model(x[i], params), 2);
      resid.push(val);
    }
    return resid;
  };

  self.jacobian = function(x, residuals, params) {
    var h = [], 
        jac = [],
        upper, lower;
    //calculate step size
    for (var i=0; i<x.length; i++) {
      h = x[i] * self.epsilon;
      upper = residuals(x[i] + h, params);
      lower = residuals(x[i] - h, params);
      fjac[i] = 0.5*(upper-lower) / h;
    }
    return fjac;
  };

  self.iterate = function (residuals, params) {

  };

  self.fit = function(x, residuals, initialParams) {
    var iterationNumber = 0, 
        paramEstimate = initialParams;

    for (var i=0; i<=fitterOptions.maxIterations; i++) {
      paramEstimate = self.iterate(x, residuals, paramEstimate);
    }
  };
}


function linear(x, params) {
  var m = params[0],
      b = params[1];
  return x.map(function (val) {return m*val + b;});
}

function residuals(x, y, params) {
  var resid =[];

  for (var i=0; i<x.length; i++) {
    val = Math.pow(y[i] - linear(x[i], params), 2);
    resid.push(val);
  }
  return resid;

}


minimizer = new Minimizer();
minimizer.residuals = residuals;
minimizer.maxIterations = 50;