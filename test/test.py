from kmpfit.kmpfit import Fitter
import numpy as np

def residuals (pars, data):
    C = pars[0]
    A = pars[1]
    w = pars[2]
    print pars
    x, y = data
    return yvals - (C + A * np.sin(w * x))

xvals = np.array([0,     0.5263,      1.053,      1.579,      2.105,      2.632,      3.158,     
                  3.684,      4.211,      4.737,      5.263,      5.789,      6.316,      6.842,      
                  7.368,      7.895,      8.421,      8.947,      9.474,         10])

yvals = np.array([0,      4.825,      8.641,      10.14,      8.479,      4.901,    -0.1654,     
                 -5.26,     -8.698,     -9.681,     -8.115,     -4.855,     0.3295,      5.166,     
                 9.197,      9.865,      8.164,      4.762,    -0.4914,     -5.578])

p0 = [1.0, 9.0, 1.3]
fitobj = Fitter(residuals=residuals, data=(xvals, yvals))
fitobj.fit(params0=p0)

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