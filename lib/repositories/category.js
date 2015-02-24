'use strict';

var bluebird  = require('bluebird');
var bookshelf = require('./bookshelf');


var Category = bookshelf.Model.extend({
  tableName: 'categories',
  hasTimestamps: true,

  series: function() {
    var Serie = require('./serie');
    return this.hasMany(Serie);
  },

  children: function() {
    return this.series();
  }

},{
  getTree: bluebird.method(function() {
    return this.fetchAll({ withRelated: ['children'] });
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
