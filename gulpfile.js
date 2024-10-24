/* jshint strict: false */
var jaderef = require('gulp-jade/node_modules/jade');
jaderef.filters.code = function( block ) {
    return block
        .replace( /&/g, '&amp;' )
        .replace( /</g, '&lt;' )
        .replace( />/g, '&gt;' )
        .replace( /"/g, '&quot;' );
};

var gulp = require('gulp'),
  livereload = require('gulp-livereload'),
  browserify = require('gulp-browserify'), 
  jade = require('gulp-jade'), 
  stylus = require('gulp-stylus');

gulp.task('watch', function () {
  gulp.watch(['./app/**/*.jade', './app/**/*.js', './index.jade', './src/**'], ['build']);
});


gulp.task('stylusdev', function () {
  return gulp.src('./app/**/*.styl')
    .pipe(stylus())
    .pipe(gulp.dest('app'));
});

gulp.task('jade', gulp.series('stylusdev', function () {
  return gulp.src("./app/**/*.jade")
    .pipe(jade({pretty:true, locals: {min: ''}}))
    .pipe(gulp.dest('app'));
}));

gulp.task('build', gulp.series('jade', function () {
  return gulp.src("./index.jade")
    .pipe(jade({pretty:true, locals: {min: ''}}))
    .pipe(gulp.dest('.'))
    .pipe(livereload());
}));


