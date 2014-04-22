function Minimizer(options) {
  var self = this;
  epsilon = 2.220446049250313e-16;
  residuals = null;

  var defaultOptions = {
    maxIterations: 100
  };

  var fitterOptions = defaultOptions;
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) fitterOptions[key] = options[key];
    }
  }

  self.jacobian = function(x, residuals) {
    var h = [];
    //calculate step size
    for (var i=0; i<x.length; i++) {
      h.push(x[i] * self.epsilon);
    }


  }
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