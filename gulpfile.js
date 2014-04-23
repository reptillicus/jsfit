/* jshint strict: false */

var gulp = require('gulp'),
  livereload = require('gulp-livereload'),
  browserify = require('gulp-browserify');

gulp.task('watch', function () {
  gulp.watch(['src/**'], ['build']);
});

gulp.task('browserify', function() {
  browserify()
    .pipe()
})

gulp.task('build', function () {
  return gulp.src('src/minimizer.js')
    .pipe(browserify())
    .pipe(gulp.dest('build/'))
    .pipe(livereload())
});


