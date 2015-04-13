'use strict';

var bluebird  = require('bluebird');
var bcrypt = require('bcrypt');
var bookshelf = require('./bookshelf');
var page = require('./page');
var release = require('./release');
var config = require('../config');

bluebird.promisifyAll(bcrypt);

var User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  pages: function() {
    return this.hasMany(page);
  },

  releases: function() {
    return this.hasMany(release);
  },

  passwordMatch: function(passwd) {
    /* jshint validthis: true */
    return bcrypt.compareAsync(passwd, this.get('password'));
  }
},{
  createUser: function(user) {
    return this.forge(user).save();
  },

  encryptPassword: function(password) {
    return bcrypt.hashAsync(password, config.get('bcrypt'));
  },

  loginUser: function(user, password) {
    user = user.toLowerCase().trim();
    return this.query({where: {email: user}, orWhere: {username: user}})
      .fetch({require: true})
      .tap(function(user) {
        return bcrypt.compareAsync(password, user.get('password')).then(function(data) {
          if (!data)
            throw new Error('not match');
        });
      });
  },

  getSingle: function(id) {
    return this.query({where: {id: Number.parseInt(id)}}).fetch({require: true});
  }
});

module.exports = User;