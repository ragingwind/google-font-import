'use strict';

var through2 = require('through2');
var dom5 = require('dom5');
var pred = dom5.predicates;
var _ = require('lodash');
var got = require('got');
var css = require('css');
var fs = require('fs');

function readHTML(uri) {
  if (!uri) {
    throw new Error('URI or html string is null');
  }

  if (_.startsWith(uri, 'file://')) {
    return fs.createReadStream(uri);
  } else if (_.startsWith(uri, 'http')) {
    return got(uri);
  } else {
    var Readable = require('stream').Readable;
    var stream = new Readable();
    stream.push(uri);
    stream.push(null);
    return stream;
  }
}

function tackLink() {
  return through2.obj(function (data, enc, done) {
    var stream = this;
    var dom = dom5.parse(data.toString('utf8'));
    var links = _.pluck(dom5.queryAll(dom, pred.hasTagName('link')), 'attrs[1].value');
    var fonts = [];

    _.each(links, function (url, index) {
      got('http:' + url, function(err, content) {
        fonts.push({
          url: url,
          content: content
        });

        if (index === links.length - 1) {
          stream.push(fonts);
          done();
        }
      });
    });
  });
}

function makeManifest() {
  return through2.obj(function (fonts, enc, done) {
    var fontManifest = [];
    _.each(fonts, function(font) {
      _.each(css.parse(font.content).stylesheet.rules, function(rule) {
        if (rule.type !== 'font-face' || !rule.declarations) {
          return;
        }
        var property = {};

        _.each(rule.declarations, function(decl) {
          if (decl.property === 'src') {
            var re = /([\w]*)\(([\w\d':_.\/ -]*)\)/g;
            var source;

            while ((source = re.exec(decl.value))) {
              property[source[1]] = source[2].replace(/\'/g, '');
            }
          } else {
            property[decl.property] = decl.value;
          }
        });

        fontManifest.push({
          got: got(property.url),
          font: property
        });
      });
    });

    this.push(fontManifest);
    done();
  });
}

function imports(uri) {
  return readHTML(uri).pipe(tackLink())
    .pipe(makeManifest());
}

module.exports = imports;
