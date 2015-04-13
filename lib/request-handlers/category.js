'use strict';

var _ = require('lodash');
var handler = require('../helpers/handler');
var Category = require('../repositories/category');

var getCategories = handler.getAll(Category, null, {sort: true});
exports.getCategories = getCategories;

var getCategory = handler.getSingle(Category, 'category_id');
exports.getCategory = getCategory;

function* createCategory() {
  /*jshint validthis: true*/
  var body = this.request.body;

  body = _.pick(body, ['title', 'slug', 'sort', 'type', 'meta', 'media']);

  if (!body.title || !_.isString(body.title)) this.throw(409, 'Missing or invalid title in body');

  if (!body.slug) {
    body.slug = _.kebabCase(body.title);
  }

  var exists = yield new Category({slug: body.slug}).fetch();
  if (exists) this.throw(409, 'A category with that slug already exists');

  if (!body.sort) {
    body.sort = 1;
  }

  if (!_.isPlainObject(body.meta)) {
    body.meta = {};
  }

  if (!_.isPlainObject(body.media)) {
    body.media = {};
  }

  var category = new Category(body);
  category.save();
  this.body = category;
}
exports.createCategory = createCategory;

function* updateCategory() {
  /* jshint validthis: true*/
  var category = yield getCategory.call(this, true);

  if (!category) return;

  var body = this.request.body;

  body = _.pick(body, ['title', 'slug', 'sort', 'type', 'meta', 'media']);

  if (body.slug !== category.get('slug') && body.slug) {
    var check = yield getCategory.call(this, true, body.slug);
    if (check) this.throw(409, 'A slug with that already exists');
  }

  category.set(body);
  category.save();
  this.body = category;
}
exports.updateCategory = updateCategory;

function* deleteCategory() {
  /* jshint validthis: true */
  var category = yield getCategory.call(this, true);

  if (!category) return;

  var series = yield category.series().fetch()
  if (series.length) {
    return this.throw(403, 'Cannot delete category before emptying it.');
  }

  category.destroy();

  this.status = 204;
}
exports.deleteCategory = deleteCategory;
