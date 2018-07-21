#!/usr/bin/env nodejs

'use strict';

const gulp = require('gulp');
const spawn = require('child_process').spawnSync;
const through = require('through2');
const rimraf = require('rimraf').sync;
const mkdirp = require('mkdirp').sync;
const runSequence = require('run-sequence');

const cmdPipe = function (cmd, args) {
  return through.obj(function (file, enc, cb) {
    let child = spawn(cmd, args, { input: file.contents });
    file.contents = child.stdout;
    this.push(file);
    cb(child.error);
  });
}

const minify = function (type) {
  return cmdPipe('minify', ['--type', type]);
};

const scss = function() {
  return through.obj(function (file, enc, cb) {
    let child = spawn(
      'sassc',

      [
        '-m', '-t', 'compressed', file.path,
        ('static/assets/css/' + file.relative.replace('scss', 'css'))
      ]
    );

    cb(child.error);
  });
};

const hugo = function() {
  spawn('hugo', [
    '--cleanDestinationDir',
    '--gc',
    '--ignoreCache',
    '--noChmod',
    '--noTimes'
  ]);
};

gulp.task('clean', function () {
  [
    'static/assets/css',
    'static/assets/js',
    'static/assets/fonts',
    'static/assets/images'
  ].forEach(function (dir) {
    rimraf(dir + '/**');
    mkdirp(dir);
  });

  rimraf('public');
});

gulp.task('css', function () {
  return gulp.src('src/css/**/*.css')
             .pipe(minify('css'))
             .pipe(gulp.dest('static/assets/css'));
});

gulp.task('scss', function () {
  return gulp.src(['src/scss/**/*.scss', '!src/scss/**/_*.scss'])
             .pipe(scss());
});

gulp.task('js', function () {
  return gulp.src('src/js/**/*.js')
             .pipe(minify('js'))
             .pipe(gulp.dest('static/assets/js'));
});

gulp.task('fonts', function () {
  return gulp.src([
    'src/fonts/**/*.otf',
    'src/fonts/**/*.ttf'
  ]).pipe(gulp.dest('static/assets/fonts'));
});

gulp.task('images', function () {
  return gulp.src([
    'src/images/**/*.jpg',
    'src/images/**/*.png',
    'src/images/**/*.svg'
  ]).pipe(gulp.dest('static/assets/images'));
});

gulp.task('favicon', function () {
  return gulp.src('src/favicon.ico').pipe(gulp.dest('static'));
});

gulp.task('hugo', function () {
  hugo();
});

gulp.task('html', function () {
  return gulp.src('public/**/*.html')
             .pipe(minify('html'))
             .pipe(gulp.dest('public'));
});

gulp.task('xml', function () {
  return gulp.src('public/**/*.xml')
             .pipe(minify('xml'))
             .pipe(gulp.dest('public'));
});

gulp.task('default', function() {
  runSequence(
    'clean',
    ['css', 'scss', 'js', 'fonts', 'images', 'favicon'],
    'hugo',
    ['html', 'xml']
  );
});
