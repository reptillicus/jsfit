"use strict"

function Minimizer(model, data, initialParams, options) {
  var self = this;
  //the smallest possible delta due to floating point precision.
  self.epsilon = numeric.epsilon*100;
  //store the x values on self
  self.xvals = data[0];
  //store the y values on self
  self.yvals = data[1];
  //store the function for the model on self
  self.model = model;
  //store the parameters on self
  self.params = initialParams;
  //set the initial params
  self.initialParams = initialParams;
  //the number of parameters
  self.npars = initialParams.length;
  //the l-m damping parameter
  self.lambda = 0.001 

  var defaultOptions = {
    maxIterations: 200, 
    debug: false,
    ftol :1e-10, 
    chart: false,
    paramDeltaConverge: 0.001,
  };

  //merge in any options that are passed in into the defaultOptions object
  self.fitterOptions = defaultOptions;
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) self.fitterOptions[key] = options[key];
    }
  }

  //Make sure that parInfo, if it came through, is the same length as the 
  //parameter array
  if (self.fitterOptions.parInfo) {
    if (self.fitterOptions.parInfo.length !== self.npars) {
      throw new Error('parInfo and params must be SAME length')
    }
  }


  //calculates the residuals from the  y-values and the model/params
  // r_i = y_i - self.model(x_i, params)
  this.residuals = function(params) {
    var resid =[];
    for (var i=0; i<self.xvals.length; i++) {
      var val = self.yvals[i] - self.model(self.xvals[i], params);
      resid.push(val);
    }
    return resid;
  };

  //gives the sum of the squared residuals.
  this.ssr = function(params) {
    var ssr;
    ssr = numeric.dot(self.residuals(params), self.residuals(params));
    return ssr;
  };

  //passing in an m x n array, return an array with only the diagonals, all the rest are zeros
  this.diagonal = function (arr) {
    var dim, out;
    dim = numeric.dim(arr);
    out = numeric.rep(dim,0);
    for (var i=0; i<dim[0]; i++) {
      for (var j=0; j<dim[1]; j++) {
        out[i][j] = arr[i][j];
      }
    }
    return out;
  };


  //TODO: Make this derivative a two sided one! 
  this.jacobian = function(params) {
    var h, 
        fjac = numeric.rep([self.xvals.length, self.npars],0),
        origParams, 
        modParams, 
        fjac_row = [];

    for (var i=0; i<params.length; i++) {
      modParams = params.slice(0);
      //Scale the step to the size of the paramter
      h = Math.abs(params[i] * self.epsilon);
      modParams[i] = params[i] + h;
      for (var j=0; j<self.xvals.length; j++) {
        var val1 = self.model(self.xvals[j], modParams);
        var val2 = self.model(self.xvals[j], params);
        fjac[j][i] = (val1 - val2) / h;
      }
    }
    if (self.fitterOptions.debug) {
      console.log("fjac:");
      console.log(numeric.prettyPrint(fjac))
    }
    return fjac;
  };

  //perform the minimization iteratively
  this.iterate = function (params) {
    //l-m algorithm 
    //newParams = oldParams - [Jt•J - lam*diag(Jt•J)]^-1 • Jt•R
    //gauss-newton algorithm
    // newParams = oldParams + (Jt•J)^-1 • Jt•R
    var jac = self.jacobian(params);
    var jacTrans = numeric.transpose(jac);
    var jtj = numeric.dot(jacTrans, jac);
    var jtjInv = numeric.inv(jtj);
    var diag = self.diagonal(jtj);
    var step1, step2, step3, step4,
        term2, lambda, newParams, oldSSR, newSSR;

    lambda = 0.001;
    oldSSR = self.ssr(params);
    step1 = numeric.dot(jtjInv, jacTrans);
    step2 = numeric.dot(step1, self.residuals(params));
    newParams = numeric.add(params, step2);
    newSSR = self.ssr(newParams);
    
    return newParams;
  };

  //the main public method for 
  this.fit = function() {
    var iterationNumber = 0, 
        paramEstimate = self.params,
        oldParams,
        oldSSR,
        converge,
        ssr = self.ssr(paramEstimate);

    for (var i=0; i<=self.fitterOptions.maxIterations; i++) {
      iterationNumber++
      oldParams = paramEstimate;
      oldSSR = self.ssr(paramEstimate);
      paramEstimate = self.iterate(oldParams);
      ssr = self.ssr(paramEstimate)

      converge = Math.abs((ssr-oldSSR)/ssr);
      if (self.fitterOptions.debug) {
        console.log("parEstimate", paramEstimate, converge, ssr, iterationNumber);
      }
      if (converge < 0.00001) {
        paramEstimate = oldParams;
        ssr = oldSSR;
        break;
      }


    }
    return {"params": paramEstimate, "ssr": ssr, iterations:iterationNumber};
  };
}
