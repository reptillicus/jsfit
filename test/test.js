var linear = function(x, params) {
  var m = params[0], 
      b = params[1];
  return (m*x + b);
};

var data = [
        [1, 2.5, 3, 4, 5], 
        [1, 2.5, 3, 4, 5]
       ];

var p0 = [1.2, 2.0];

console.log(linear, data, p0)
var minimizer = new Minimizer(linear, data, p0);
minimizer.fit();



