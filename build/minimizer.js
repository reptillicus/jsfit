(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function zeros(rows, columns) {

}



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

  self.residuals = function(params) {
    var resid =[];
    for (var i=0; i<self.xvals.length; i++) {
      val = Math.pow(y[i] - self.model(self.xvals[i], params), 2);
      resid.push(val);
    }
    return resid;
  };

  self.jacobian = function(params) {
    var h = [], 
        fjac = numeric.rep([self.npars,self.xvals.length],0),
        upper, lower;
    //calculate step size
    for (var i=0; i<params.length; i++) {
      h = params[i] * self.epsilon;
      for (var j=0; j<self.xvals.length; j++) {
        upper = self.model(self.xvals[j], params+h);
        lower = self.model(self.xvals[j], params-h);
        console.log(upper, lower, self.model(self.xvals[j], params+h))
        fjac[i][j] = 0.5*(upper-lower) / h;
      }
    }
    console.log(fjac)
    return fjac;
  };

  self.iterate = function (params) {
    //newParams = oldParams + (Jt * J)^-1 * Jt * residuals
    var jac = self.jacobian(params);
    var jacTrans = numeric.transpose(jac);
    var step1, step2, step3, newParams;

    console.log(jac, jacTrans)

    step1 = numeric.inv(numeric.dot(jacTrans, jac));
    step2 = numeric.dot(step1, jacTrans);
    step3 = numeric.dot(step2, self.residuals);

    newParams = numeric.add(params, step3);
    return newParams;
  };


  self.fit = function() {
    var iterationNumber = 0, 
        paramEstimate = self.params;

    for (var i=0; i<=fitterOptions.maxIterations; i++) {
      paramEstimate = self.iterate(paramEstimate);
      console.log(paramEstimate);
    }
  };
}

},{}]},{},[1])