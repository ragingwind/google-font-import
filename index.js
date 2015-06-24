'use strict';

var parser5 = require('parse5');
var got = require('got');
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
    parseLink(data).forEach(function (link) {
      this.push(link);
    }.bind(this));
    done();
  };
  return parser;
}

function fetch() {
  var Transform = require('stream').Transform;
  var stream = new Transform({objectMode: true});
  stream._transform = function(data, encoding, done) {
    got(data.value, function(err, data, res) {
      stream.push(data);
      done();
    });
  };
  return stream;
}

function download() {
  var Transform = require('stream').Transform;
  var stream = new Transform({objectMode: true});
  stream._transform = function(data, encoding, done) {
    console.log(data);
  };
  return stream;
}

module.exports = {
  get: function(uri) {
    read(uri).pipe(parse())
             .pipe(fetch())
             .pipe(download());
  }
};
