'use strict';

var bookshelf = require('./bookshelf');
var category = require('./category');
var release = require('./release');

var Serie = bookshelf.Model.extend({
  tableName: 'series',
  hasTimestamps: true,

  category: function() {
    return this.belongsTo(category);
  },

  releases: function() {
    return this.hasMany(release);
  }
}, {
  getSingle: function(id) {
    var where = {id: Number.parseInt(id)};
    if (!where.id) {
      where = {slug: id};
    }
    return this.query({where: where}).fetch({require: true});
  }
});

module.exports = Serie;
