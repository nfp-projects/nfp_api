'use strict';

var User = require('../repositories/user');

function* getProfile() {
  /*jshint validthis: true */
  if (!this.user.id) this.throw(401);
  var ctx = this;

  yield User.query({where: {id: this.user.id}})
    .fetch()
    .then(function(user) {
      ctx.body = user.omit('password');
    });
}
exports.getProfile = getProfile;

function* updateProfile() {
  /*jshint validthis: true */
  var ctx = this;
  var body = this.request.body;
  this.log.info(body);

  var user = yield User.query({where: {id: this.user.id}}).fetch();

  if (user.get('username') !== body.username && body.username === user.get('email')) {
    var checkUser = yield User.query({where: {username: body.username}}).fetch();
    if (checkUser) {
      this.throw(409, 'Username already exists');
    }
    user.set('username', body.username);
  }
  user.set('name', body.name);
  user.save();
  this.body = user.omit('password');
}
exports.updateProfile = updateProfile;