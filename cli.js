#!/usr/bin/env node

'use strict';

var meow = require('meow');
var gfGot = require('./');

var cli = meow({
  help: [
    'Usage',
    ' gf-got <origin-html-path> -t <target-html-path> -o <font-download-path> -f',
    '',
    'Example',
    ' gf-got app/layout.html -t dist/layout.html -o dist/fonts/'
  ].join('\n')
});

var manifest = gfGot.manifest(cli.input[0]);

manifest.fonts.forEach(function (font) {
  font.got().pipe(write());
});

// write target html containing updated html

