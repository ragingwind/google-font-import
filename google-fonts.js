var dom5 = require('dom5');

function getHref(link) {
  var href = null;

  link.attrs.forEach(function(attr) {
    if (attr.name === 'href') {
      href = attr;
    }
  });

  return href;
}

function GoogleFonts(html) {
  this.dom = null;
  this.fontLinks = [];

  if (html) {
    this.queryLink(html);
  }
}

GoogleFonts.prototype.parse = function (html) {
  this.dom = dom5.parse(html);
  var links = dom5.queryAll(this.dom, pred.hasTagName('link'));

  links.forEach(function (link) {
    var attr = getHref(link);
    if (attr && attr.value.indexOf('fonts.googleapis.com') !== -1) {
      this.fontLinks.push(link);
    }
  });

  return this.fontLinks;
}

module.exports = GoogleFonts;

