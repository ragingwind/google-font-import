'use strict';

var parser5 = require('parse5');
var got = require('got-promise');
var _ = require('lodash');
var next = require('next-promise');

function read(uri) {
  if (_.startsWith(uri, 'file://')) {
    return fs.createReadStream(uri);
  } else if (_.startsWith(uri, 'http')) {
    return got(uri);
  } else {
    var Stream = require('stream');
    var stream = new Stream();
    stream.pipe = function(dest) {
      dest.write(uri)
      return dest;
    }
    return stream;
  }
}

function parseLink(html) {
  var link = [];
  var parser = new parser5.SimpleApiParser({
    startTag: function(name, attrs, selfClosing) {
      if (name === 'link' && attrs) {
        var href = attrs[_.findIndex(attrs, {name: 'href'})];

        if (href && href.value.indexOf('fonts.googleapis.com') !== -1) {
          link.push(href);
        }
      }
    }
  });

  parser.parse(html);

  return link;
}


function parse() {
  var Transform = require('stream').Transform;
  var parser = new Transform({objectMode: true});
  parser._transform = function(data, encoding, done) {
    var link = parseLink(data);
    this.push(link);
    done();
  };
  return parser;
}

function download() {
  var Transform = require('stream').Transform;
  var parser = new Transform({objectMode: true});
  parser._transform = function(data, encoding, done) {
    console.log(data);
    done();
  };
  return parser;
}

module.exports = {
  get: function(uri) {
    read(uri).pipe(parse())
             .pipe(download());
  }
};
