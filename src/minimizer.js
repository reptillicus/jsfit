"use strict"

function Minimizer(model, data, initialParams, options) {
  var self = this;
  self.epsilon = numeric.epsilon;
  self.xvals = data[0];
  self.yvals = data[1];
  self.model = model;
  self.params = initialParams;
  self.initialParams = initialParams;
  self.npars = initialParams.length;
  console.log(self)

  var defaultOptions = {
    maxIterations: 100
  };

  var fitterOptions = defaultOptions;
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) fitterOptions[key] = options[key];
    }
  }

  this.residuals = function(params) {
    var resid =[];
    for (var i=0; i<self.xvals.length; i++) {
      val = Math.pow(self.yvals[i] - self.model(self.xvals[i], params), 2);
      resid.push(val);
    }
    return resid;
  };

  this.jacobian = function(params) {
    var h, 
        fjac = numeric.rep([self.npars,self.xvals.length],0),
        upper, lower, 
        upper_params = [], 
        lower_params = [];
    console.log(upper_params, lower_params)
    for (var i=0; i<params.length; i++) {
      h = params[i] * self.epsilon;
      params[i] = params[i] + h
      for (var j=0; j<self.xvals.length; j++) {
        // upper = self.model(self.xvals[j], upper_params);
        // lower = self.model(self.xvals[j], lower_params);
        var val = self.model(self.xvals[j], params);
        // console.log(upper, lower, h)
        // fjac[i][j] = 0.5*(upper-lower) / h;
        fjac[i][j] = 1.0
      }
    }
    console.log(fjac)
    return fjac;
  };

  this.iterate = function (params) {
    //newParams = oldParams + (Jt * J)^-1 * Jt * residuals
    var jac = self.jacobian(params);
    var jacTrans = numeric.transpose(jac);
    var step1, step2, step3, newParams;

    step1 = numeric.inv(numeric.dot(jacTrans, jac));
    step2 = numeric.dot(step1, jacTrans);
    step3 = numeric.dot(step2, self.residuals);

    newParams = numeric.add(params, step3);
    return newParams;
  };


  this.fit = function() {
    var iterationNumber = 0, 
        paramEstimate = self.params;

    for (var i=0; i<=fitterOptions.maxIterations; i++) {
      paramEstimate = self.iterate(paramEstimate);
      console.log(paramEstimate);
    }
  };
}
