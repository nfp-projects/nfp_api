'use strict';

var bluebird  = require('bluebird');
var bookshelf = require('./bookshelf');
var Hashids = require('hashids');
var config = require('../config');
var hashids = new Hashids(config);

var User = require('./user');

var Media = bookshelf.Model.extend({
  tableName: 'media',
  hasTimestamps: true,

  initialize: function() {
    this.on('created', this.addEndId);
  },

  addEndId: function(item) {
    item.set('encid', hashids.encode(item.id));
    item.save();
  },

  user: function() {
    return this.belongsTo(User);
  },
},{
  getSingle: function(id) {
    var where = {id: Number.parseInt(id)};
    if (!where.id) {
      where = {encid: id};
    }
    return this.query({where: where}).fetch({require: true});
  }
});

Media.Collection = function() {
  return bookshelf.Collection.extend({
    model: Media
  });
}

module.exports = Media;
