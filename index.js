'use strict';

var fs = require('fs');
var path = require('path');
var dom5 = require('dom5');
var pred = dom5.predicates;
var _ = require('lodash');
var got = require('got');
var css = require('css');
var PinkiePromise = require('pinkie-promise');
var mkdirp = require('mkdirp');
// var url = require('url');

var chromeHeader = {
  headers: {
    'user-agent': 'ozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36'
  }
};

function escape(qs) {
  return qs.replace(/\?|\=|,|:|\+/g, '_');
}

function processHTML(src, htmlpath, stylepath) {
  return new PinkiePromise(function (resolve) {
    if (!fs.statSync(src).isFile()) {
      throw new Error('HTML path is invalid');
    }

    fs.readFile(path.resolve(src), function (err, content) {
      if (err) {
        throw err;
      }

      var dom = dom5.parse(content.toString('utf8'));
      var urls = _.map(_.pluck(dom5.queryAll(dom, pred.hasTagName('link')), 'attrs[1]'), function(href) {
        var url = null;
        if (href.value.indexOf('fonts.googleapis.com') >= 0) {
          url = href.value;
          // replace by updated style path
          href.value = path.join(stylepath, escape(path.basename(href.value)));
        }
        return url;
      });

      // write html file with new style path
      fs.writeFileSync(path.resolve(htmlpath), dom5.serialize(dom));

      resolve(urls);
    });
  });
}

function downloadCSS(urls) {
  function gotLink(url) {
    return new PinkiePromise(function (resolve, reject) {
      got(url, chromeHeader, function (err, content) {
        if (!err) {
          resolve({url: url, content: content});
        } else {
          reject(err);
        }
      });
    });
  }

  return PinkiePromise.all(_.map(urls, gotLink));
}

function processCSS(url, content, stylepath, fontpath) {
  var style = css.parse(content);
  var fonts = [];

  _.each(style.stylesheet.rules, function(rule) {
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

        font.filepath = path.join(fontpath, path.basename(font.url));
        decl.value = decl.value.replace(font.url, path.relative(stylepath, font.filepath));
      } else {
        font[decl.property] = decl.value;
      }
    });

    fonts.push(font);
  });

  fs.writeFileSync(path.join(stylepath, escape(path.basename(url))), css.stringify(style));

  return fonts;
}

function downloadFonts(fontpath) {
  return function(fonts) {
    function gotFont(font) {
      return new PinkiePromise(function (resolve) {
        got(font.url).pipe(fs.createWriteStream(font.filepath)).on('close', function() {
          resolve(font);
        });
      });
    }

    return PinkiePromise.all(_.map(fonts, gotFont));
  };
}

function preparePath(opts) {
  mkdirp.sync(opts.htmlpath);

  if (opts.stylepath) {
    mkdirp.sync(opts.stylepath);
  } else {
    opts.stylepath = opts.htmlpath;
  }

  if (opts.fontpath) {
    mkdirp.sync(opts.fontpath);
  } else {
    opts.fontpath = opts.htmlpath;
  }
}

function imports(opts, done) {
  opts = opts || {};

  if (!opts.src) {
    throw new Error('Source path must be exist');
  }
  preparePath(opts);

  return processHTML(opts.src, path.join(opts.htmlpath, path.basename(opts.src)), opts.stylepath)
    .then(downloadCSS)
    .then(function(res) {
      var fonts = [];

      _.forEach(res, function(r) {
        fonts = fonts.concat(processCSS(r.url, r.content, opts.stylepath, opts.fontpath));
      });

      return fonts;
    })
    .then(downloadFonts(path.resolve(opts.fontpath)))
    .then(function() {
      if (done) {
        done();
        return;
      }
    }).catch(function(e) {
      if (done) {
        done(e);
        return;
      }
    });
}

module.exports = imports;
