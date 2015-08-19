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

var chromeHeader = {
  headers: {
    'user-agent': 'ozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36'
  }
};

function escape(qs) {
  return qs.replace(/\?|\=|,|:|\+/g, '_');
}

function processHTML(src, predicates) {
  return new PinkiePromise(function (resolve) {
    if (!fs.statSync(src).isFile()) {
      throw new Error('HTML path is invalid');
    }

    fs.readFile(path.resolve(src), function (err, content) {
      if (err) {
        throw err;
      }

      var dom = dom5.parse(content.toString('utf8'));
      var urls = _.map(_.pluck(dom5.queryAll(dom, pred.hasTagName('link')), 'attrs[1]'), predicates);

      resolve({
        content: dom5.serialize(dom),
        urls: urls
      });
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

function processCSS(content, predicates) {
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

        // seperate values of src property
        while ((source = re.exec(decl.value))) {
          font[source[1]] = source[2].replace(/\'/g, '');
        }

        decl.value = predicates(decl.value, font.url);
      } else {
        // keep its property
        font[decl.property] = decl.value;
      }
    });

    fonts.push(font);
  });

  return {
    content: css.stringify(style),
    fonts: fonts
  };
}

function downloadFonts(predicates) {
  return function(fonts) {
    function gotFont(font) {
      return new PinkiePromise(function (resolve) {
        var fontpath = predicates(font.url);
        got(font.url).pipe(fs.createWriteStream(fontpath)).on('close', function() {
          resolve(font);
        });
      });
    }

    return PinkiePromise.all(_.map(fonts, gotFont));
  };
}

function imports(opts, done) {
  opts = opts || {};

  if (!opts.src || !opts.htmlpath) {
    throw new Error('Source path must be exist');
  }

  function preparePath() {
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

  function replaceStylePath(href) {
    var url = null;
    if (href.value.indexOf('fonts.googleapis.com') >= 0) {
        url = href.value;
        // replace by updated style path
        href.value = path.join(path.relative(opts.htmlpath, opts.stylepath), escape(path.basename(href.value)));
    }
    return url;
  }

  function writeHTML(res) {
    fs.writeFileSync(path.resolve(path.join(opts.htmlpath, path.basename(opts.src))), res.content);
    return res.urls;
  }

  function extractFonts(res) {
    var fonts = [];

    _.forEach(res, function(r) {
      var css = processCSS(r.content, function(oldUrl, newUrl) {
        // replace the path of url to local path
        return oldUrl.replace(newUrl, path.relative(opts.stylepath,
            path.join(opts.fontpath, path.basename(newUrl))));
      });

      fonts = fonts.concat(css.fonts);

      fs.writeFileSync(path.join(opts.stylepath, escape(path.basename(r.url))), css.content);
    });

    return fonts;
  }

  function getFontFilePath(fontURL) {
    return path.join(opts.fontpath, path.basename(fontURL));
  }

  preparePath();

  return processHTML(opts.src, replaceStylePath)
    .then(writeHTML)
    .then(downloadCSS)
    .then(extractFonts)
    .then(downloadFonts(getFontFilePath))
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
