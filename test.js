'use strict';
var assert = require('assert');
var googleFontImporter = require('./');

var html = '<html><head><link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:400,300,300italic,400italic,500,500italic,700,700italic"></head></html>';

it('Simple parse', function () {
	googleFontImporter({html:html});
	assert(true);
});
