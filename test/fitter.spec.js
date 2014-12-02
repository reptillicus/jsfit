function linear(x, params) {
  var m = params[0], 
      b = params[1];
  return (m*x + b);
}

describe("A suite", function() {
  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });
  it("test", function () {
    var a = 1;
    expect(a).toEqual(1);
  });
  it("perfect linear", function () {
    xvals = [1,2,3,4,5];
    yvals = [1,2,3,4,5];
    var par0 = [3, 3];
    var data = [xvals, yvals];
    var fitobj = jsfit.fit(linear, data, par0);
    expect(fitobj).not.toBe(null);
    expect(fitobj.params).toBe([1.0, 1.0])
  });
});