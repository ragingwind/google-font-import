/*global it:true*/
'use strict';
var assert = require('assert');
var imports = require('./');
var fs = require('fs');
var path = require('path');
var fontsdump = require('./fixture/fontdumps.json');

var opts = {
  src: './fixture/roboto.html',
  htmlpath: './.tmp',
  fontpath: './.tmp/fonts',
  stylepath: './.tmp'
};

it('should be downloaded all of fonts', function (done) {
  imports(opts).then(function () {
    fontsdump.styles.forEach(function(style) {
      assert(fs.statSync(path.join(opts.stylepath, style)));
    });

    fontsdump.fonts.forEach(function(font) {
      assert(fs.statSync(path.join(opts.fontpath, font)));
    });

    done();
  });
});
