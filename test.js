'use strict';
var assert = require('assert');
var googleFontImporter = require('./');

it('should ', function () {
	assert.strictEqual(googleFontImporter('unicorns'), 'unicorns & rainbows');
});
