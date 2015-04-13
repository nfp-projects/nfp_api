'use strict';

var _ = require('lodash');
var handler = require('../helpers/handler');
var User = require('../repositories/user');

var getUsers = handler.getAll(User, null, {filter: filter, sort: 'id'});
exports.getUsers = getUsers;

var getUser = handler.getSingle(User, 'user_id', {filter: filter});
exports.getUser = getUser;

function* updateUser() {
  /* jshint validthis: true*/
  var user = yield getUser.call(this, true);

  if (!user) return;

  var body = this.request.body;

  body = _.pick(body, ['username', 'name', 'url', 'text', 'level']);

  if (body.username !== user.get('username') && body.username) {
    var check = yield getUser.call(this, true, body.username);
    if (check) this.throw(409, 'A user with that username already exists');
  }

  user.set(body);
  user.save();
  user = filter(user);
  this.body = user;
}
exports.updateUser = updateUser;

function* deleteUser() {
  /* jshint validthis: true */
  var user = yield getUser.call(this, true);

  if (!user) return;

  user.destroy();

  this.status = 204;
}
exports.deleteUser = deleteUser;

function filter(user) {
  if (!user) return user;

  user = user.omit('password');

  return user;
}
