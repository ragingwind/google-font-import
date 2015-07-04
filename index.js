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
  return through2(function (data, enc, done) {
    var stream = this;
    var dom = dom5.parse(data.toString('utf8'));
    var links = dom5.queryAll(dom, pred.hasTagName('link'));

    links.forEach(function (link) {
      link.attrs.forEach(function(attr) {
        if (attr.name === 'href' && attr.value.indexOf('fonts.googleapis.com') !== -1) {
          stream.push(attr.value);
        }
      });
    });
    done();
  });
}

function gotFontManifest() {
  return through2.obj(function (data, enc, done) {
    console.log(data);
    return got('http:' + data.value);
    done();
  });
}

function gotFonts() {
  return through2.obj(function (data, enc, done) {
    console.log(gotFonts, data);
    done();
    // return got(data.value);
  });
}

function imports(uri) {
  return promise(
    readHTML(uri),
    tackLink(),
    got()
    // gotFontManifest()
  );
}

module.exports = imports;
