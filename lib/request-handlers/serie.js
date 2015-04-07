'use strict';

var _ = require('lodash');
var handler = require('../helpers/handler');
var Serie = require('../repositories/serie');
var Category = require('../repositories/category');

var getSeries = handler.getAll(Serie, {category_id: Category});
exports.getSeries = getSeries;

var getSerie = handler.getSingle(Serie, 'serie_id');
exports.getSerie = getSerie;

function* createSerie() {
  /*jshint validthis: true*/
  var body = this.request.body;

  body = _.pick(body, ['category_id', 'title', 'slug', 'text', 'meta', 'media']);

  if (!body.title || !_.isString(body.title)) this.throw(409, 'Missing or invalid title in body');
  if (!body.category_id) {
    if (!this.params.category_id) this.throw(409, 'Missing category_id');

    body.category_id = this.params.category_id;
  }

  try {
    var category = yield Category.getSingle(body.category_id);
    body.category_id = category.id;
  }
  catch (error) {
    this.throw(409, 'Category with specified id does not exist');
  }

  if (!body.slug) {
    body.slug = _.kebabCase(body.title);
  }

  var check = yield getSerie.call(this, true, body.slug);
  if (check) this.throw(409, 'A slug with that already exists');

  if (!_.isPlainObject(body.meta)) {
    body.meta = {};
  }

  if (!_.isPlainObject(body.media)) {
    body.media = {};
  }

  var serie = new Serie(body);
  serie.save();
  this.body = serie;
}
exports.createSerie = createSerie;

function* updateSeries() {
  /* jshint validthis:true */
  var serie = yield getSerie.call(this, true);

  if (!serie) return;

  var body = this.request.body;

  body = _.pick(body, ['category_id', 'title', 'slug', 'text', 'meta', 'media']);

  if (body.slug !== serie.get('slug') && body.slug) {
    var check = yield getSerie.call(this, true, body.slug);
    if (check) this.throw(409, 'A slug with that already exists');
  }

  if (body.category_id !== serie.get('category_id')) {
    try {
      var category = yield Category.getSingle(body.category_id);
      body.category_id = category.id;
    }
    catch (error) {
      this.throw(409, 'Category with specified id does not exist');
    }
  }

  serie.set(body);
  serie.save();
  this.body = serie;
}
exports.updateSeries = updateSeries;
