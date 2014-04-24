"use strict"

function Minimizer(model, data, initialParams, options) {
  var self = this;
  self.epsilon = numeric.epsilon*100;
  self.xvals = data[0];
  self.yvals = data[1];
  self.model = model;
  self.params = initialParams;
  self.initialParams = initialParams;
  self.npars = initialParams.length;

  var defaultOptions = {
    maxIterations: 100, 
    debug: false,
    ftol :1e-10
  };

  self.fitterOptions = defaultOptions;
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) self.fitterOptions[key] = options[key];
    }
  }

  //Make sure that parInfo, if it cam through, is the same length as the 
  //parameter array
  if (self.fitterOptions.parInfo) {
    if (self.fitterOptions.parInfo.length !== self.npars) {
      throw new Error('parInfo and params must be SAME length')
    }
  }

  this.residuals = function(params) {
    var resid =[];
    for (var i=0; i<self.xvals.length; i++) {
      var val = Math.pow(self.yvals[i] - self.model(self.xvals[i], params), 2);
      resid.push(val);
    }
    return resid;
  };

  this.ssr = function(params) {
    var ssr;
    ssr = numeric.sum(self.residuals(params));
    return ssr;
  };

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

  this.jacobian = function(params) {
    var h, 
        fjac = numeric.rep([self.xvals.length, self.npars],0),
        origParams, 
        modParams, 
        fjac_row = [];

    for (var i=0; i<params.length; i++) {
      modParams = params.slice(0);
      h = params[i] * self.epsilon;
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

  this.iterate = function (params) {
    //newParams = oldParams - [Jt•J - lam*diag(Jt•J)]^-1 • Jt•R
    var jac = self.jacobian(params);
    var jacTrans = numeric.transpose(jac);
    var jtj = numeric.dot(jacTrans, jac);
    var diag = self.diagonal(jtj);
    var step1, step2, step3, step4,
        term2, lambda, newParams;

    lambda = 0.001;
    // console.log( numeric.prettyPrint(numeric.dot(jacTrans, jac) ))
    term2 = numeric.mul(jtj, lambda)
    console.log(term2)
    step2 = numeric.inv(numeric.sub(jtj, term2))
    console.log(step2)
    step3 = numeric.dot(step2, jacTrans);
    console.log(step3)
    // console.log("step2", numeric.prettyPrint(step2))
    step4 = numeric.dot(step3, self.residuals(params));
    // console.log("params", numeric.prettyPrint(params))
    // console.log("residuals", numeric.prettyPrint(self.residuals(params)))
    // console.log("step3", numeric.prettyPrint(step3));
    newParams = numeric.sub(params, step3);
    return newParams;
  };


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
        console.log("parestimate", paramEstimate, converge);
      }

      if (converge < 0.0001) {
        paramEstimate = oldParams;
        ssr = oldSSR;
        break;
      }

    }
    return {"params": paramEstimate, "ssr": ssr, iterations:iterationNumber};
  };
}
