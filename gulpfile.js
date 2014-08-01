/* jshint strict: false */

var gulp = require('gulp'),
  livereload = require('gulp-livereload'),
  browserify = require('gulp-browserify'), 
  jade = require('gulp-jade'), 
  stylus = require('gulp-stylus');

gulp.task('watch', function () {
  gulp.watch(['src/**', 'test/**'], ['build']);
});

// gulp.task('browserify', function() {
//   browserify()
//     .pipe()
// });

gulp.task('stylusdev', [], function () {
  return gulp.src('./test/*.styl')
    .pipe(stylus())
    .pipe(gulp.dest('test'));
});

gulp.task('jade', ['stylusdev'], function () {
  return gulp.src("./test/*.jade")
    .pipe(jade({pretty:true, locals: {min: ''}}))
    .pipe(gulp.dest('test'));
});

gulp.task('build', ['jade'], function () {
  return gulp.src('src/jsfit.js')
    .pipe(livereload())
});


