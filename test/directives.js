app.directive('mathjax',function(){
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      // MathJax.Hub.Queue(["Reprocess", MathJax.Hub, elem[0]]);
      MathJax.Hub.Queue(['Typeset', MathJax.Hub,elem[0]]);
    }
  };
});