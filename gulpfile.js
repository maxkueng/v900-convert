var gulp = require('gulp');
var convert = require('gulp-convert');

gulp.task('csv2json', function(){
  gulp.src(['rt2012/*.CSV'])
    .pipe(convert({
      from: 'csv',
      to: 'json'
     }))
    .pipe(gulp.dest('json/'));
});
