// "use strict"

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
  self.lambda = 0.001;
  //stopping reason
  self.stopReason = null;
  //number of observations
  self.nvals = self.xvals.length;

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
      throw new Error('parInfo and params must be SAME length');
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

  this.hessian = function () {
    var jac, jacTrans, hes;
    jac = self.jacobian(self.params);
    jacTrans = numeric.transpose(jac);
    hes = numeric.dot(jacTrans, jac);
    return hes;
  };

  this.covar = function () {
    /*
      If the minimisation uses the weighted least-squares function f_i = (Y(x, t_i) - y_i) / \sigma_i then the covariance matrix 
      above gives the statistical error on the best-fit parameters resulting from the Gaussian errors \sigma_i on 
      the underlying data y_i. This can be verified from the relation \delta f = J \delta c and the
      fact that the fluctuations in f from the data y_i are normalised by \sigma_i and so satisfy <\delta f \delta f^T> = I.

      For an unweighted least-squares function f_i = (Y(x, t_i) - y_i) the covariance matrix above should be 
      multiplied by the variance of the residuals about the best-fit \sigma^2 = \sum (y_i - Y(x,t_i))^2 / (n-p) to 
      give the variance-covariance matrix \sigma^2 C. This estimates the statistical error on the best-fit 
      parameters from the scatter of the underlying data.
    */

    var hes, covar;
    hes = self.hessian();
    covar = numeric.inv(hes);
    covar = numeric.mul(covar, self.totalError());
    return covar;
  };

  this.parameterErrors = function () {
    //should be just the diagonal elements of the covariance matrix
    var covar, parameterErrors;
    covar = self.covar();
    parameterErrors = numeric.sqrt(numeric.getDiag(covar));
    return parameterErrors;
  };

  this.totalError = function() {
    // sig^2 = r(p)T * r(p) / (m -n) , m=# of obs, n = #of free params
    var totalError, dof, r;

    dof = self.nvals - self.npars;
    r = self.residuals(self.params);
    totalError = numeric.dot(r, r) / dof;
    return totalError;
  };

  //TODO: Make this derivative a two sided one! 
  this.jacobian = function(params) {
    var h, 
        fjac = numeric.rep([self.xvals.length, self.npars],0),
        origParams, 
        modParamsHigh,
        modParamsLow, 
        fjac_row = [];

    for (var i=0; i<params.length; i++) {
      modParamsLow = params.slice(0);
      modParamsHigh = params.slice(0);
      //Scale the step to the size of the paramter
      h = Math.abs(params[i] * self.epsilon);
      modParamsLow[i] = params[i] - h;
      modParamsHigh[i] = params[i] + h;
      for (var j=0; j<self.xvals.length; j++) {
        var val1 = self.model(self.xvals[j], modParamsHigh);
        var val2 = self.model(self.xvals[j], modParamsLow);
        fjac[j][i] = (val1 - val2) / (2*h);
      }
    }
    if (self.fitterOptions.debug) {
      console.log("fjac:");
      console.log(numeric.prettyPrint(fjac));
    }
    return fjac;
  };

  //perform the minimization iteratively
  this.iterate = function (params) {
    //l-m algorithm 
    //newParams = oldParams + [Jt•J - lam*diag(Jt•J)]^-1 • Jt•R
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
        errorEstimate,
        oldParams,
        oldSSR,
        converge,
        ssr = self.ssr(paramEstimate), 
        paramErrors;


    for (var i=0; i<self.fitterOptions.maxIterations; i++) {
      iterationNumber++;
      oldParams = self.params;
      oldSSR = self.ssr(oldParams);
      self.params = self.iterate(oldParams);
      ssr = self.ssr(self.params);

      converge = Math.abs((ssr-oldSSR)/ssr);
      if (self.fitterOptions.debug) {
        console.log("parEstimate", self.params, converge, ssr, iterationNumber);
      }
      if (converge < 1e-3){
        self.stopReason = "convergence";
        break;
      }

    }
    if (iterationNumber == self.fitterOptions.maxIterations) {
      self.stopReason = "maxIterations";
    }
    return {
              "params": self.params,
              "parameterErrors": self.parameterErrors(),
              "hessian": self.hessian(),
              "jac": self.jacobian(self.params),
              "covar": self.covar(),
              "ssr": ssr, 
              iterations:iterationNumber, 
              stopReason:self.stopReason, 
              initialParams: self.initialParams,
              xvals: self.xvals, 
              yvals: self.yvals,
           };
  };
}
