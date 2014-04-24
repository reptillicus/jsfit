function exponential(x, params) {
  var A = params[0], 
      d = params[1];
  return (A * Math.exp(d * x));
}

function linear(x, params) {
  var m = params[0], 
      b = params[1];
  return (m*x + b);
}



var data = [
        [1, 2, 3, 4, 5], 
        [1, 2.1, 3.2, 4.0, 5.3]
       ];

var p0 = [1.1, 0.1];

var minimizer = new Minimizer(linear, data, p0, {'debug': true, parInfo: [1, 2]});
var start = new Date().getTime();
var fit = minimizer.fit();
var end = new Date().getTime();
var time = end - start;
console.log("time", time)



