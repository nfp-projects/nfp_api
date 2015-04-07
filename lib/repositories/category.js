'use strict';

var bluebird  = require('bluebird');
var bookshelf = require('./bookshelf');


var Category = bookshelf.Model.extend({
  tableName: 'categories',
  hasTimestamps: true,

  initialize: function() {
    this.on('created', this.addSort);
  },

  addSort: function(item) {
    item.set('sort', item.id);
    item.save();
  },

  series: function() {
    var Serie = require('./serie');
    return this.hasMany(Serie);
  },

  children: function() {
    return this.series();
  }

},{
  getTree: bluebird.method(function() {
    return this.query('orderBy', 'sort', 'asc').fetchAll({ withRelated: ['children'] });
  }),

  getSingle: function(id) {
    var where = {id: Number.parseInt(id)};
    if (!where.id) {
      where = {slug: id};
    }
    return this.query({where: where}).fetch({require: true});
  }
});

module.exports = Category;
