import numpy
from kmpfit import kmpfit

def linear(p, x):
    return p[0] + p[1] * x

def linear_residuals(p, data):  # Residuals function needed by kmpfit
    x, y = data           # Data arrays is a tuple given by programmer
    a, b = p              # Parameters which are adjusted by kmpfit
    return (y - linear(p, x))

d = numpy.array([1,2,3,4,5])
v = numpy.array([1,2,3,4,5])

paramsinitial = [10.0, 10.0]
fitobj = kmpfit.Fitter(residuals=linear_residuals, data=(d,v))
fitobj.fit(params0=paramsinitial)

print "\nFit status kmpfit:"
print "===================="
print "Best-fit parameters:        ", fitobj.params
print "Asymptotic error:           ", fitobj.xerror
print "Error assuming red.chi^2=1: ", fitobj.stderr
print "Chi^2 min:                  ", fitobj.chi2_min
print "Reduced Chi^2:              ", fitobj.rchi2_min
print "Iterations:                 ", fitobj.niter
print "Number of free pars.:       ", fitobj.nfree
print "Degrees of freedom:         ", fitobj.dof