#!/usr/bin/env node

'use strict';

var meow = require('meow');
var imports = require('./');

var cli = meow({
  help: [
    'Usage',
    ' gf-import <html-path> --html=<html-output> --font=<font-output> --style=<style-output>',
    '',
    'Example',
    ' gf-import ./fixture/roboto.html --html=./.tmp --font=./.tmp/font --style=./.tmp',
    '',
    'Options',
    ' - --html: html path to save the file having new path of style',
    ' - --font: destination path for a downloaded font',
    ' - --style: stylesheet path to save the file having new path of the font'
  ].join('\n')
});

if (cli.input.length === 0 || !cli.flags.html) {
  console.error('Source or HTML path must be passed');
  process.exit(-1);
  return;
}

imports({
  src: cli.input[0],
  htmlpath: cli.flags.html,
  fontpath: cli.flags.font,
  stylepath: cli.flags.style
}).then(function () {
  process.exit(0);
}).catch(function(e) {
  console.error(e);
});

process.stdin.resume();
