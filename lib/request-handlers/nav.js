'use strict';

var _ = require('lodash');

var category = require('../repositories/category');
var page = require('../repositories/page');

function* getNav() {
  /*jshint validthis: true */
  var categories = yield category.getTree();
  var pages = yield page.getTree();

  this.body = _([
    categories.toArray(),
    pages.toArray()
  ]).flatten().compact().value();
}
exports.getNav = getNav;
