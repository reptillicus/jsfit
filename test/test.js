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
var generatePointsData = function(data, model, p0, params) {
  var points = [],
      line = [], 
      initial = [],
      xvals, 
      yvals;

  xvals = data[0];
  yvals = data[1];

  for (var i = 0; i < data[0].length; i++) {
    points.push({x:xvals[i] , y: yvals[i]});
    line.push({x: xvals[i], y: model(xvals[i], params)});
    initial.push({x: xvals[i], y: model(xvals[i], p0)});
  }

  return [
    {
      values: points,
      key: 'Data',
      color: '#ff7f0e'
    },
    {
      values: line,
      key: 'Fit',
      color: '#2ca02c'
    }, 
    {
      values: initial,
      key: 'Initial',
      color: 'steelBlue'
    }
  ];
};




var data = [
        [1, 2, 3, 4, 5, 6, 7, 8],
        [8.3, 11.0, 14.7, 19.7, 26.7, 35.2, 44.4, 55.9]
       ];
var p0 = [1.0, 0.2];


var minimizer = new Minimizer(exponential, data, p0, {'debug': false, parInfo: [{'name': 'A'}, {'name': 'k'}] });
var start = new Date().getTime();
var fit = minimizer.fit();
console.log(fit)
var end = new Date().getTime();
var time = end - start;

console.log("time", time)

nv.addGraph(function() {
  var chart = nv.models.lineChart()
                .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                .transitionDuration(350)  //how fast do you want the lines to transition?
                .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                .showYAxis(true)        //Show the y-axis
                .showXAxis(true)        //Show the x-axis
                .xDomain([0,10])
                .yDomain([0,80])
  ;

  chart.xAxis     //Chart x-axis settings
      .tickFormat(d3.format(',r'));

  chart.yAxis     //Chart y-axis settings
      .tickFormat(d3.format('.02f'));

  /* Done setting the chart up? Time to render it!*/
  var myData = generatePointsData(data, exponential, p0, fit.params);   //You need data...

  d3.select('#chart_after svg')    //Select the <svg> element you want to render the chart in.   
      .datum(myData)         //Populate the <svg> element with chart data...
      .call(chart);          //Finally, render the chart!

  //Update the chart when window resizes.
  nv.utils.windowResize(function() { chart.update() });
  return chart;
});

p0 = [1.0, 0.04];
var npoints = 100;
xvals = numeric.linspace(1,npoints);
clean = xvals.map(function(d, i){return exponential(d, p0);});
noise = numeric.add(numeric.sub(numeric.mul(numeric.random([npoints]), 0.5), 0.25), 1.0);
yvals = numeric.mul(clean, noise);
data2 = [ 
         xvals, 
         yvals,
        ];
console.log(data2)

p0 = [3.0, 0.015]
var start = new Date().getTime();var start = new Date().getTime();
var minimizer = new Minimizer(exponential, data2, p0, {'debug': true, parInfo: [{'name': 'A'}, {'name': 'k'}] });
var fit2 = minimizer.fit();
console.log(fit2)
var end = new Date().getTime();
var time = end - start;
console.log("time2", time)

nv.addGraph(function() {
  var chart = nv.models.lineChart()
                .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                .transitionDuration(350)  //how fast do you want the lines to transition?
                .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                .showYAxis(true)        //Show the y-axis
                .showXAxis(true)        //Show the x-axis
  ;

  chart.xAxis     //Chart x-axis settings
      .tickFormat(d3.format(',r'));

  chart.yAxis     //Chart y-axis settings
      .tickFormat(d3.format('.02f'));

  /* Done setting the chart up? Time to render it!*/
  var myData = generatePointsData(data2, exponential, p0, fit2.params);   //You need data...

  d3.select('#chart_large svg')    //Select the <svg> element you want to render the chart in.   
      .datum(myData)         //Populate the <svg> element with chart data...
      .call(chart);          //Finally, render the chart!

  //Update the chart when window resizes.
  nv.utils.windowResize(function() { chart.update() });
  return chart;
});





