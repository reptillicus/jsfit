// "use strict"

function Minimizer(model, data, initialParams, options) {
  //make a copy to keep around inside the methods. 
  var self = this;
  //the smallest possible delta due to floating point precision.
  self.epsilon = numeric.epsilon*100;
  //store the x values on self
  self.xvals = data[0];
  //store the y values on self
  self.yvals = data[1];
  //number of observations
  self.nvals = self.xvals.length;
  //the weights array, if it exists. If not, set all points to have unit weights
  if (data.length < 3) {
    self.weights = numeric.rep([self.nvals], 1.0);
  } else { 
    self.weights = data[2];
  }
  //store the function for the model on self
  self.model = model;
  //store the parameters on self
  self.params = initialParams;
  //set the initial params
  self.initialParams = initialParams;
  //the number of parameters
  self.npars = initialParams.length;
  //degrees of freedom
  self.dof = self.nvals - self.npars;
  //the l-m damping parameter
  self.lambda = 0.01;
  //the lambda up paramaeter
  self.lambdaPlus = 10.0;
  //the lambda decrease parameter
  self.lambdaMinus = 0.25;
  //stopping reason
  self.stopReason = null;
  //number of jac calcs
  self.numJac = 0;
  //the reason for stopping
  self.stopReason = null;
  
  //the default fitter options
  var defaultOptions = {
    maxIterations: 200, 
    debug: false,
    ftol :1e-10, 
    chart: false,
    paramDeltaConverge: 0.001,
  };

  if (self.xvals.length !== self.yvals.length) {
    throw new Error('x and y values are different lengths');
  }

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
  // r_i = 1/w_i * (y_i - model(x_i, params))
  self.residuals = function(params) {
    var resid =[];
    for (var i=0; i<self.xvals.length; i++) {
      var val = (1/self.weights[i])*(self.yvals[i] - self.model(self.xvals[i], params));
      resid.push(val);
    }
    return resid;
  };

  //gives the sum of the squared residuals.
  self.ssr = function(params) {
    var ssr;
    ssr = numeric.dot(self.residuals(params), self.residuals(params));
    return ssr;
  };

  //passing in an m x n array, return an array with only the diagonals, all the rest are zeros
  self.diagonal = function (arr) {
    var dim, out;
    dim = numeric.dim(arr);
    out = numeric.rep(dim,0);
    for (var i=0; i<dim[0]; i++) {
      for (var j=0; j<dim[1]; j++) {
        if (i===j) {
          out[i][j] = arr[i][j];
        }
      }
    }
    return out;
  };

  self.hessian = function () {
    // H = 2 * Jt•J
    var jac, jacTrans, hes;
    jac = self.jacobian(self.params);
    jacTrans = numeric.transpose(jac);
    hes = numeric.mul(2.0, numeric.dot(jacTrans, jac));
    return hes;
  };

  self.covar = function () {
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

  self.parameterErrors = function () {
    //should be just the diagonal elements of the covariance matrix
    var covar, parameterErrors;
    covar = self.covar();
    parameterErrors = numeric.sqrt(numeric.getDiag(covar));
    return parameterErrors;
  };

  self.totalError = function() {
    // sig^2 = r(p)T * r(p) / (m -n) , m=# of obs, n = #of free params
    var totalError, dof, r;

    dof = self.nvals - self.npars;
    r = self.residuals(self.params);
    totalError = numeric.dot(r, r) / dof;
    return totalError;
  };

  self.jacobian = function(params) {
    // Calculate a numeric jacobiab of the parameters. 
    // Jt•J is the approximation of the hessian
    //
    var h, 
        fjac = numeric.rep([self.xvals.length, self.npars],0),
        origParams, 
        modParamsHigh,
        modParamsLow, 
        fjac_row = [];

    for (var i=0; i<params.length; i++) {
      modParamsLow = params.slice(0);
      modParamsHigh = params.slice(0);
      //Scale the step to the magnitude of the paramter
      h = Math.abs(params[i] * self.epsilon);
      modParamsLow[i] = params[i] - h;
      modParamsHigh[i] = params[i] + h;
      for (var j=0; j<self.xvals.length; j++) {
        var left = self.model(self.xvals[j], modParamsHigh);
        var right = self.model(self.xvals[j], modParamsLow);
        fjac[j][i] = (left - right) / (2*h);
      }
    }
    //update the number of times jac has been calculated
    self.numJac++;

    return fjac;
  };

  self.fixParameters= function(pars) {
    //fix any parameters if they are going out of bounds
    if (self.fitterOptions.parInfo) {
      for (var k=0; k<pars.length; k++) {
        //set the limits, if they exist in the parInfo array
        if (self.fitterOptions.parInfo[k].limits) {
          if (pars[k] < self.fitterOptions.parInfo[k].limits[0]) {
            pars[k] = self.fitterOptions.parInfo[k].limits[0];
            // pars[k] = self.initialParams[k];
          }
          if (pars[k] > self.fitterOptions.parInfo[k].limits[1]) {
            pars[k] = self.fitterOptions.parInfo[k].limits[1];
            // pars[k] = self.initialParams[k]
          }
        }

        //reset the fixed params to the initial values
        if (self.fitterOptions.parInfo[k].fixed) {
          pars[k] = self.initialParams[k];
        }
      }
    }
    return pars;
  };

  self.lmStep = function (params) {
    var newParams, 
        jac, jacTrans, jtj, jtjInv, identity,
        diag, cost_gradient, g, delta, t;
    // console.log(self.lambda)
    jac = self.jacobian(params);
    jacTrans = numeric.transpose(jac);
    jtj = numeric.dot(jacTrans, jac);
    diag = self.diagonal(jtj);
    identity = numeric.identity(numeric.dim(jtj)[0]);
    cost_gradient = numeric.dot(jacTrans, self.residuals(params));
    g = numeric.add(jtj, numeric.mul(self.lambda, diag));
    t = numeric.add(jtj, numeric.mul(self.lambda, identity));
    // console.log(numeric.prettyPrint(g));
    // console.log(numeric.prettyPrint(t));
    delta = numeric.dot(cost_gradient, numeric.inv(g));
    delta = numeric.mul(delta, 1.0)
    // console.log(delta)
    newParams = numeric.add(params, delta);
    console.log(params, newParams)
    return newParams;
  };

  self.guassNewtonStep = function (params) {
    //TODO? Not sure if needed
  };

  //perform the minimization iteratively
  self.iterate = function (params) {
    //l-m algorithm 
    //newParams = oldParams + [Jt•J - lam*diag(Jt•J)]^-1 • Jt•R
    //gauss-newton algorithm
    // newParams = oldParams + (Jt•J)^-1 • Jt•R
    // var jac = self.jacobian(params);
    // var jacTrans = numeric.transpose(jac);
    // var jtj = numeric.dot(jacTrans, jac);
    // var jtjInv = numeric.inv(jtj);
    // var diag = self.diagonal(jtj);
    // var step1, step2, step3, step4,
    //     term2, lambda, newParams, oldSSR, newSSR;
    // var cost, newCost;
    // var g, delta, cost_gradient;
    var cost, newCost, newParams


    cost = 0.5 * self.ssr(params);
    // cost_gradient = numeric.dot(jacTrans, self.residuals(params));
    // console.log(diag)
    // identity = numeric.identity(numeric.dim(jtj)[0])
    // g = numeric.add(jtj, numeric.mul(self.lambda, diag));
    // var t = numeric.add(jtj, numeric.mul(self.lambda, identity));
    // console.log(numeric.prettyPrint(g))
    // console.log(numeric.prettyPrint(t))
    // // g = numeric.add(jtj, numeric.mul(self.lambda, identity));
    // delta = numeric.dot(cost_gradient, numeric.inv(g));
    // newParams = numeric.add(params, delta);
    // console.log(delta)    
    newParams = self.lmStep(params);
    //fix and params that are fixed or limited
    newParams = self.fixParameters(newParams);
    newCost = 0.5 * self.ssr(newParams);
    if (newCost < cost) {
      self.lambda *= 0.5;
    } else {
      self.lambda *= 10;
      // newParams = params.slice(0);
    }

    // while (newCost >= cost) {
    //   console.log("in while loop")
    //   self.lambda = self.lambda * self.lambdaPlus;
    //   // jac = self.jacobian(newParams);
    //   // jacTrans = numeric.transpose(jac);
    //   // jtj = numeric.dot(jacTrans, jac);
    //   // jtjInv = numeric.inv(jtj);
    //   // self.lambda = self.lambda * self.lambdaPlus;
    //   // cost_gradient = numeric.dot(jacTrans, self.residuals(newParams));
    //   // g = numeric.sub(jtj, numeric.mul(diag, self.lambda));
    //   // newParams = numeric.add(params, numeric.dot(numeric.inv(g), cost_gradient));
    //   newParams = self.lmStep(newParams);
    //   newParams = self.fixParameters(newParams);
    //   newCost = 0.5 * self.ssr(newParams);
    //   // console.log(cost, newCost, self.lambda, newParams)
    // }
    // self.lambda = self.lambda * self.lambdaMinus;
    // console.log(cost, newCost, params, newParams);

    return newParams;
  };

  //the main public method for the fitter. All other methods are really internal.
  self.fit = function() {
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

      if (self.fitterOptions.debug) {
        console.log("parEstimate", self.params, converge, ssr, iterationNumber, ssr-oldSSR);
      }
      //If the SSR is really small, that means we are getting a perfect fit, so stop
      if (ssr < self.fitterOptions.ftol) {
        self.stopReason = "ftol";
        break;
      }

      //check for convergence based on change in SSR over last iterations
      converge = Math.abs((ssr-oldSSR)/ssr);
      if (converge < 1e-6){
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
              "chi2": self.ssr(self.params), 
              "chi2_red": self.ssr(self.params)/self.dof,
              "dof": self.dof, 
              "iterations":iterationNumber, 
              "stopReason":self.stopReason, 
              "initialParams": self.initialParams,
              "xvals": self.xvals, 
              "yvals": self.yvals,
              "residuals": self.residuals(self.params),
              "numJac": self.numJac
           };
  };
}
