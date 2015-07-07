'use strict';

var through2 = require('through2');
var promise = require('promisepipe');
var dom5 = require('dom5');
var pred = dom5.predicates;
var _ = require('lodash');
var got = require('got');
var css = require('css');

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
      got('http:' + url, function(err, css) {
        fonts.push({
          url: url,
          css: css
        });

        if (index === links.length - 1) {
          stream.push(fonts);
          done();
        }
      });
    });
  });
}

function gotFonts() {
  return through2.obj(function (fonts, enc, done) {
    var fontManifest = [];
    fonts.forEach(function(d) {
      css.parse(d.css).stylesheet.rules.forEach(function(f) {
        console.log(d.url)
        if (f.type === 'font-face') {
          var property = {};
          _.each(f.declarations, function(decl) {
            if (decl.property === 'src') {
              var sourceRe = /([\w]*)\(([\w\d':_.\/]*)\)/g;
              var source;

              console.log(decl.value);
              while ((source = sourceRe.exec(decl.value))) {
                property[source[1]] = source[2];
                console.log(source[1], source[2])
              }
              console.log('----------------')
            } else {
              property[decl.property] = decl.value;
            }
          });

          console.log(property);
        }
      });
    });

    done();
  });
}

function imports(uri) {
  return promise(
    readHTML(uri),
    tackLink(),
    gotFonts()
  );
}

module.exports = imports;
