// "use strict"

function Minimizer(model, data, initialParams, options) {
  //make a copy to keep around inside the methods. 
  var self = this;

  //calculates the residuals from the  y-values and the model/params
  // r_i = 1/w_i * (y_i - model(x_i, params))
  self.residuals = function(params) {

    // var resid = [];
    var resid = new Float32Array(self.xvals.length);
    for (var i=0; i<self.xvals.length; i++) {
      var val = (1/self.weights[i])*(self.yvals[i] - self.model(self.xvals[i], params));
      resid[i] = val;
    }
    return resid;
  };

  //gives the sum of the squared residuals.
  self.ssr = function(params) {
    var ssr;
    ssr = numeric.dot(self.residuals(params), self.residuals(params));
    return ssr;
  };

  self.chi2 = function (params) {
    var chi2 = 0.0, 
        obs, exp;

    for (var i=0; i<self.xvals.length; i++) {
      exp = self.model(self.xvals[i], params);
      obs = self.yvals[i];
      w = self.weights[i];
      chi2 += Math.pow(((obs-exp)/(w)), 2);
    }
    return chi2;
  }

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
    var covar, parameterErrors, out = numeric.rep([self.npars], 0.0)
    covar = self.covar();
    parameterErrors = numeric.sqrt(numeric.getDiag(covar));
    //Patch in the fixed parameters. . . 
    for (var i=0, counter=0; i<self.free.length; i++) {
      if (self.free[i]) {
        out[i] = parameterErrors[counter];
        counter++;
      }
    }
    return out;
  };

  self.totalError = function() {
    // sig^2 = r(p)T * r(p) / (m -n) , m=# of obs, n = #of free params
    var totalError, dof, r;

    r = self.residuals(self.params);
    totalError = numeric.dot(r, r) / self.dof;
    return totalError;
  };

  self.where = function (arr, target) {
    /*
      Helper method. returns the indices of the elements that match the target. 
    */
    var dim, 
        indices =[];
    dim = numeric.dim(arr);
    if (dim.length === 1) {
      for (var i=0; i<dim[0]; i++) {
        if (arr[i] === target) {
          indices.push(i);
        }
      }
    } else if (dim.length === 2) {
      for (var i=0; i<dim[0]; i++) {
        for (var j=0; j<dim[1]; j++) {
          if (arr[i][j] == target) {
            indices.push([i, j]);
          }
        }
      }
    }
    return indices;
  };

  self.jacobian = function(params) {
    // Calculate a numeric jacobiab of the parameters. 
    // Jt•J is the approximation of the hessian
    //
    var h, 
        fjac = numeric.rep([self.xvals.length, self.ifree],0),
        // fjac = [],
        origParams, 
        modParamsHigh,
        modParamsLow, 
        left, right, par_idx, col;

    for (var i=0; i<self.ifree.length; i++) {
      par_idx = self.ifree[i];
      modParamsLow = params.slice(0);
      modParamsHigh = params.slice(0);
      //Scale the step to the magnitude of the paramter
      h = Math.abs(params[par_idx] * self.epsilon);
      modParamsLow[par_idx] = params[par_idx] - h;
      modParamsHigh[par_idx] = params[par_idx] + h;
      col = new Float32Array(self.xvals.length);
      for (var j=0; j<self.xvals.length; j++) {
        left = self.model(self.xvals[j], modParamsHigh);
        right = self.model(self.xvals[j], modParamsLow);
        fjac[j][i] = (left - right) / (2*h);
        // col[j] = (left - right) / (2*h);
      }
      // fjac.push(col);
    }
    
    // console.log(fjac)
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

  self.lmStep = function (params, jac) {
    var t1 = new Date()
    var newParams, 
        jacTrans, jtj, jtjInv, identity,
        diag, cost_gradient, g, delta, t, 
        allParams =[], 
        allDelta = numeric.rep([self.npars], 0.0);

    // jac = self.jacobian(params);
    jacTrans = numeric.transpose(jac);
    jtj = numeric.dot(jacTrans, jac);
    diag = self.diagonal(jtj);
    // console.log(numeric.prettyPrint(jtj))
    // identity = numeric.identity(numeric.dim(jtj)[0]);
    cost_gradient = numeric.dot(jacTrans, self.residuals(params));
    g = numeric.add(jtj, numeric.mul(self.lambda, diag));
    delta = numeric.dot(numeric.inv(g), cost_gradient);

    //Patch in the fixed parameters. . . 
    for (var i=0, counter=0; i<self.free.length; i++) {
      if (self.free[i]) {
        allDelta[i] = delta[counter];
        counter++;
      }
    }
    
    // delta = numeric.mul(delta, 1.0)
    newParams = numeric.add(params, allDelta);
    // console.log(params, newParams, allDelta)
    var t2 = new Date();
    // console.log(t2-t1)
    return newParams;
  };

  self.guassNewtonStep = function (params) {
    //TODO? Not sure if needed
  };

  //perform the minimization iteratively  
  self.iterate = function (params) {
    var cost, newCost, newParams, fjac;

    fjac = self.jacobian(params);

    cost = 0.5 * self.ssr(params);
    newParams = self.lmStep(params, fjac);
    //fix and params that are fixed or limited
    newParams = self.fixParameters(newParams);
    newCost = 0.5 * self.ssr(newParams);
    // console.log(cost, newCost, params, newParams)
    if (newCost < cost) {
      self.lambda *= self.lambdaMinus;
    } 
    // console.log(self.lambda, cost, newCost, params, newParams);

    //this is the inner loop, where we keep increasing the damping parameter if
    //the cost is greater
    while (newCost > cost) {
      self.lambda *= self.lambdaPlus;
      newParams = self.lmStep(params, fjac);
      newCost = 0.5 * self.ssr(newParams);
      // console.log(self.lambda, newParams, newCost)
    }
    
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
      if (converge < 1e-4){
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
              "parInfo": self.fitterOptions.parInfo,
              "hessian": self.hessian(),
              "jac": self.jacobian(self.params),
              "covar": self.covar(),
              "chi2": self.chi2(self.params), 
              "chi2_red": self.chi2(self.params)/self.dof,
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


  self.init = function () {
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
    //store the parameters on self
    self.params = initialParams;
    //set the initial params
    self.initialParams = initialParams;
    //the number of parameters
    self.npars = initialParams.length;
    //An array indicating if the parameter is free of fixed 
    self.free = numeric.rep([self.npars], 1);
    //the number of degrees of freedom
    self.dof = self.nvals - self.nfree;
    //the number of free parameters
    self.nfree = self.params.length;
    //store the function for the model on self
    self.ifree = self.where(self.free, 1);
    self.model = model;
    
    //the l-m damping parameter
    self.lambda = 0.01;
    //the lambda up paramaeter
    self.lambdaPlus = 5.0;
    //the lambda decrease parameter
    self.lambdaMinus = 0.5;
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
      throw new Error('x and y arrays are different lengths');
    }

    if (self.xvals.length !== self.weights.length) {
      throw new Error('x and weights arrays are different lengths');
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
      for (var i=0; i<self.npars; i++) {
        if (self.fitterOptions.parInfo[i].fixed) {
          self.free[i] = 0;
        }
      }
      self.nfree = numeric.sum(self.free);
      //degrees of freedom
      self.dof = self.nvals - self.nfree;
    }
    self.ifree = self.where(self.free, 1);
  };

  self.init();
}