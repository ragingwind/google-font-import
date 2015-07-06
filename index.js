'use strict';

var through2 = require('through2');
var promise = require('promisepipe');
var dom5 = require('dom5');
var pred = dom5.predicates;
var _ = require('lodash');
var got = require('got');

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

    _.each(links, function (url, index) {
      got('http:' + url, function(err, css) {
        stream.push({
          url: url,
          css: css
        });

        if (index === links.length - 1) {
          done();
        }
      });
    });
  });
}

function gotFonts() {
  return through2.obj(function (data, enc, done) {
    console.log('got font', data.url);
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
