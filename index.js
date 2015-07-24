'use strict';

var fs = require('fs');
var path = require('path');
var dom5 = require('dom5');
var pred = dom5.predicates;
var _ = require('lodash');
var got = require('got');
var css = require('css');
var pinkiePromise = require('pinkie-promise');

var chromeHeader = {
  headers: {
    'user-agent': 'ozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36'
  }
};

function readHtml(src) {
  return new pinkiePromise(function (resolve) {
    if (!fs.statSync(src).isFile()) {
      throw new Error('HTML path is invalid');
    }

    fs.readFile(path.resolve(src), function (err, html) {
      if (err) {
        throw err;
      }

      var dom = dom5.parse(html.toString('utf8'));
      var cssLinks = _.pluck(dom5.queryAll(dom, pred.hasTagName('link')), 'attrs[1].value')
                  .filter(function (url) {
                    return url.indexOf('fonts.googleapis.com') >= 0;
                  });

      resolve(cssLinks);
    });
  });
}

function downloadCss(cssLinks) {
  function gotLink(link) {
    return new pinkiePromise(function (resolve, reject) {
      got(link, chromeHeader, function (err, data) {
        if (!err) {
          resolve({link: link, data: data});
        } else {
          reject(err);
        }
      });
    });
  }

  return pinkiePromise.all(_.map(cssLinks, gotLink));
}

function parseCss(cssLinks) {
  return new pinkiePromise(function (resolve) {
    var fonts = [];

    _.each(cssLinks, function (link) {
      _.each(css.parse(link.data).stylesheet.rules, function(rule) {
        var font = {};
        if (rule.type !== 'font-face' || !rule.declarations) {
          return;
        }

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
    });

    resolve(fonts);
  });
}

function downloadFont(opts) {
  return function (fonts) {
    function gotFont(url) {
      var filename = path.join(opts.target, path.basename(url));
      return new pinkiePromise(function (resolve) {
        got(url).pipe(fs.createWriteStream(filename)).on('close', function() {
          resolve(url);
        });
      });
    }

    return pinkiePromise.all(_.pluck(fonts, 'url').map(gotFont));
  };
}

function imports(opts) {
  opts = opts || {};

  if (!opts.src) {
    throw new Error('Source path must be exist');
  }

  return readHtml(opts.src).then(downloadCss)
                           .then(parseCss)
                           .then(downloadFont(opts))
                           .then(function(url) {
                             console.log('done', url);
                           });
}

module.exports = imports;
