/*global it:true*/
'use strict';
var assert = require('assert');
var mkdirp = require('mkdirp');
var imports = require('./');

var opts = {
  src: './fixture/roboto.html',
  target: './.tmp'
};

mkdirp.sync('.tmp');

it('should download all of fonts', function (done) {
  imports(opts).then(function () {
    assert(true);
    done();
  });
});
