#!/usr/bin/env node

'use strict';

var meow = require('meow');
var imports = require('./');

var cli = meow({
  help: [
    'Usage',
    ' gf-got <origin-html-path> -t <target-html-path> -o <font-download-path> -f',
    '',
    'Example',
    ' gf-got app/layout.html -t dist/layout.html -o dist/fonts/'
  ].join('\n')
});

imports(cli);
