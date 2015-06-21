'use strict';

var parser5 = require('parse5');
var _ = require('lodash');

function searchHref(attrs, search) {
  if (!attrs) {
    return null;
  }

  var href = attrs[_.findIndex(attrs, {name: 'href'})];

  if (href && href.value.indexOf(search) !== -1) {
    return href;
  } else {
    return null;
  }
};

function extractLink(html) {
		var link = [];
		var parser = new parser5.SimpleApiParser({
			startTag: function(name, attrs, selfClosing) {
				if (name === 'link') {
          var href = searchHref(attrs, 'fonts.googleapis.com');
          if (href) {
            link.push(href);
          }
        }
			}
		});

    parser.parse(html);

    return link;
};

function importer(html) {
	var ret = null;
	try {
    var link = extractLink(html);
  } catch (e) {
		console.error(e);
	}
};

module.exports = function (opts) {
	opts = opts || {};

	if (opts.html) {
		importer(opts.html);
	}
};
