'use strict';

var _ = require('lodash');
var ip = require('../helpers/ip');
var jwt = require('../helpers/jwt');
var User = require('../repositories/user');
var google = require('../repositories/google');

function* authenticate() {
  /*jshint validthis: true */
  var ctx = this;
  var body = this.request.body;
  var user = null;

  //Check if we're logging in with google
  if (body.google) {
    //First try and get google profile.
    var userInfo = yield google.getProfile(body.google).catch(function(err) {
      ctx.log.warn(err, 'Unable to get profile from google');
      ctx.throw(403, 'Error retrieving profile from google.', {safe: true});
    });
    
    //Log into the user with the email from the google profile
    userInfo = userInfo[0];

    //Get the user from our database
    user = yield new User({email: userInfo.email}).fetch({require: true}).catch(function() {
      //In case we can't find user, we automatically register him.
      ctx.log.info('Creating user ' + userInfo.email);
      return User.createUser({
        username: userInfo.email.toLowerCase().trim(),
        name: [userInfo.given_name, userInfo.family_name].join(' ').trim(),
        email: userInfo.email.toLowerCase().trim(),
        password: '',
        ip: ip.getIp(ctx.req)
      });
    }).catch(function(error) {
      //On unknown erros, log it and exit.
      this.log.error(error);
      ctx.throw(403, 'Unknown error while logging in with google.', {safe: true});
    });
  }

  //Check if we're logging in with user and password
  if (body.username && body.password) {
    //Get the user from database
    try {
      user = yield User.loginUser(body.username, body.password);
    }
    catch(error) {
      ctx.throw(403, 'Username or password is wrong.', {safe: true});
    }
  }

  //No user, no authentication
  if (!user) {
    this.throw(409, 'Missing username or password', {safe: true});
  }

  this.body = {
    access_token: jwt.createUserToken(user)
  };

  return;
}
exports.authenticate = authenticate;

function* authenticated(next) {
  /*jshint validthis: true */
  if (!this.user || !this.user.id) this.throw(401);

  yield next;
}
exports.authenticated = authenticated;
