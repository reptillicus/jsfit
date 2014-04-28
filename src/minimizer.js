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
    maxIterations: 20, 
    debug: false,
    ftol :1e-10, 
    chart: false,
  };

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

  this.residuals = function(params) {
    var resid =[];
    for (var i=0; i<self.xvals.length; i++) {
      var val = self.yvals[i] - self.model(self.xvals[i], params);
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
      //Scale the step to the size of the paramter
      h = Math.abs(params[i] * self.epsilon);
      modParams[i] = params[i] + h;
      console.log("h", h)
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
    console.log("params", params)
    console.log("residuals", numeric.prettyPrint(self.residuals(params)))
    newSSR = oldSSR;
    step1 = numeric.dot(jtjInv, jacTrans);
    console.log("step1", numeric.prettyPrint(step1))
    step2 = numeric.dot(step1, self.residuals(params));
    console.log("step4", numeric.prettyPrint(step2))
    newParams = numeric.add(params, step2);
    newSSR = self.ssr(newParams);
    
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
