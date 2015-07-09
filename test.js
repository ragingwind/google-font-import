'use strict';
var assert = require('assert');
var imports = require('./');
var through2 = require('through2');
var mkdirp = require('mkdirp');

function writeFonts(cb) {
  return through2.obj(function (fonts, enc, done) {
    console.log(fonts);
    cb(fonts);
  });
}

mkdirp.sync('.tmp');

it('Simple parse', function (done) {
  var html = [
    '<html>',
    '<head>',
    '<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:400,300,300italic,400italic,500,500italic,700,700italic">',
    '<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Inconsolata:400,700">',
    '</head>',
    '</html>'
  ].join('\n');

  imports(html).pipe(writeFonts(function(fonts) {
    assert(true);
    done();
  }));
});
