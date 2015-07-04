'use strict';
var assert = require('assert');
var imports = require('./');

it('Simple parse', function (done) {
  var html = [
    '<html>',
    '<head>',
    '<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:400,300,300italic,400italic,500,500italic,700,700italic">',
    '<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Inconsolata:400,700">',
    '</head>',
    '</html>'
  ].join('\n');

  imports(html).then(function() {
    assert(true);
    done();
  });
});
