var gulp = require('gulp');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var insert = require('gulp-insert');

var config = require('./config.json');
var source = config.gulp.src;
var urlLive = config.gulp.urlLive;
var destUrl = config.gulp.urlDev; // Default destination url is dev url
var isLive = false; // Default is development, not live


/*----------------------------------- SCSS-CSS Functions/Tasks ----------------------------------*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

function prepCSS() {
  var sass = require('gulp-sass');
  var rename = require('gulp-rename');

  return gulp.src(source.scss)
  .pipe(concat('style.scss'))
  .pipe(sass())
  .pipe(gulpif(isLive, sass({outputStyle: 'compressed'}).on('error', sass.logError)))
  .pipe(rename('main.min.css'))
  .pipe(gulp.dest(destUrl + 'css'));
}

gulp.task('scss', function(done){
  prepCSS();
  versionBump('patch');
  done();
});


/*------------------------------------- HTML Functions/Tasks ------------------------------------*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

function prepHTML() {
  var merge  = require('gulp-merge');
  var htmlmin = require('gulp-htmlmin');

  return merge(
    gulp.src(source.html.header)
    .pipe(insert.append('<div id="main-wrapper">')), // Wrapping all the content in a div
    gulp.src(source.html.contents)
  )
  .pipe(concat('content.html'))
  .pipe(insert.append('</div>')) // Closing tag for #main-wrapper div
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest(destUrl + 'html'));
}

gulp.task('html', function(done){
  prepHTML();
  versionBump('patch');
  done();
});


/*-------------------------------------- JS Functions/Tasks -------------------------------------*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

function prepJS() {
  var gutil = require('gulp-util');
  var uglify = require('gulp-uglify-es').default;
  delete require.cache[require.resolve('./package.json')]; // Cache needs to be deleted for version number to be fetched fresh every time when 'watch' tasks are executed.
  var version = require('./package.json').version;
  console.log("version", version);

  return gulp.src(source.js)
  .pipe(concat('main.min.js'))
  .pipe(insert.append('console.log("Version:", "' + version + '");'))
  .pipe(gulpif(isLive, insert.append('CLog.dev = false; ')))
  .pipe(insert.append('CLog.hideCaught = true; '))
  .pipe(gulpif(isLive, uglify()))
  .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
  .pipe(gulp.dest(destUrl + 'js'));
}

gulp.task('js', function(done){
  prepJS();
  versionBump('patch');
  done();
});


/*------------------------------------ Version Number Related -----------------------------------*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

/**
* @description   --type major: bumps 1.5.1 to 2.0.0
*                --type minor: bumps 1.5.1 to 1.6.0
*                --type patch: bumps 1.5.1 to 1.5.2
*                Resource: https://www.npmjs.com/package/gulp-bump
* @param  {String} type Three possible options are: "major", "minor", "patch"
*/
function versionBump(type) {
  type = type !== undefined ? type : "patch";

  if (type !== "patch" && type !== "minor" && type !== "major") {
    type = "patch";
  }

  var bump = require('gulp-bump');

  return gulp.src('./package.json')
  .pipe(bump({type: type}))
  .pipe(gulp.dest('./'));
}

gulp.task('version-patch', function(done) {
  versionBump('patch');
  done();
});

gulp.task('version-minor', function(done) {
  versionBump('minor');
  done();
});

gulp.task('version-major', function(done) {
  versionBump('major');
  done();
});


/*------------------------------------- Gulp Watch Functions ------------------------------------*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

gulp.task('watch-html', function() {
  gulp.watch(source.html.header, gulp.parallel('html', 'version-patch'));
  gulp.watch(source.html.contents, gulp.parallel('html', 'version-patch'));
});

gulp.task('watch-js', function() {
  gulp.watch(source.js, gulp.parallel('js', 'version-patch'));
});

gulp.task('watch-scss', function() {
  gulp.watch(source.scss_watch, gulp.parallel('scss', 'version-patch'));
});

gulp.task('watch', gulp.parallel('watch-html', 'watch-js', 'watch-scss'));


/*---------------------------------------- Live-Dev Tasks ---------------------------------------*/
/*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

/**
* @description Use this function to deploy to live server. CSS and JS files are minimized in live deploy.
*/
gulp.task('live', function(done){
  isLive = true;
  destUrl = urlLive;
  prepCSS();
  prepHTML();
  prepJS();
  done();
});

gulp.task('dev', gulp.parallel('html', 'js', 'scss', 'version-patch'));
