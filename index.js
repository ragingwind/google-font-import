'use strict';

var fs = require('fs');
var path = require('path');
var dom5 = require('dom5');
var pred = dom5.predicates;
var _ = require('lodash');
var got = require('got');
var css = require('css');
var Promise = require('pinkie-promise');

var chromeHeader = {
  headers: {
    'user-agent': 'ozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36'
  }
};

function gotall(urls) {
  var gots = _.map(urls, function (url) {
    return new Promise(function (resolve, reject) {
      got(url, chromeHeader, function (err, data) {
        if (err) {
          return reject(err);
        }
        
        resolve({
          url: url,
          data: data
        });
      });
    });
  });

  return Promise.all(gots);
}

function readHtml(src) {
  return new Promise(function (resolve) {
    if (!fs.statSync(src).isFile()) {
      throw new Error('HTML path is invalid');
    }

    fs.readFile(path.resolve(src), function (err, html) {
      if (err) {
        throw err;
      }

      var dom = dom5.parse(html.toString('utf8'));
      var urls = _.pluck(dom5.queryAll(dom, pred.hasTagName('link')), 'attrs[1].value')
                  .filter(function (url) {
                    return url.indexOf('fonts.googleapis.com') >= 0;
                  });

      resolve(urls);
    });
  });
}

function extractFonts(content) {
  var fonts = [];
  _.each(css.parse(content).stylesheet.rules, function(rule) {
    if (rule.type !== 'font-face' || !rule.declarations) {
      return;
    }

    var font = {};
    _.each(rule.declarations, function(decl) {
      if (decl.property === 'src') {
        var re = /([\w]*)\(([\w\d':_.\/ -]*)\)/g;
        var source;
        while ((source = re.exec(decl.value))) {
          font[source[1]] = source[2].replace(/\'/g, '');
        }
      } else {
        font[decl.property] = decl.value;
      }
    });
    fonts.push(font);
  });

  return fonts;
}

function parse(csses) {
  return new Promise(function (resolve) {
    var fonts = [];
    _.each(csses, function (css) {
      fonts = fonts.concat(extractFonts(css.data));
    });
    resolve(fonts);
  });
}

function download(opts) {
  return function (fonts) {
    var gots = _.pluck(fonts, 'url').map(function(url) {
      var filename = path.join(opts.target, path.basename(url));
      return new Promise(function (resolve) {
        got(url).pipe(fs.createWriteStream(filename)).on('close', function() {
          resolve();
        });
      });
    });
    return Promise.all(gots);
  };
}

function imports(opts) {
  opts = opts || {};

  if (!opts.src) {
    throw new Error('Source path must be exist');
  }

  return readHtml(opts.src).then(gotall)
                           .then(parse)
                           .then(download(opts))
                           .then(function () {
                             console.log('done');
                           });
}

module.exports = imports;
