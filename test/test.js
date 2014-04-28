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
        [1, 2, 3, 4, 5, 6, 7, 8],
        [8.3, 11.0, 14.7, 19.7, 26.7, 35.2, 44.4, 55.9]
       ];

var p0 = [6.0, 0.3];

var minimizer = new Minimizer(exponential, data, p0, {'debug': true, parInfo: [{'name': 'A'}, {'name': 'k'}] });
var start = new Date().getTime();
var fit = minimizer.fit();
var end = new Date().getTime();
var time = end - start;
console.log("time", time)



