'use strict';

var User = require('../repositories/user');
var ip = require('../helpers/ip');
var config = require('../config');
var mailgun = require('../repositories/mailgun');
var jwt = require('../helpers/jwt');
var emails = require('../helpers/emails');
var authentication = require('./authentication');

/**
 * Reponse handler for getting an authenticated
 * user profile.
 */
function* getProfile() {
  /*jshint validthis: true */
  if (!this.user.id) this.throw(401);
  var ctx = this;

  yield User.query({where: {id: this.user.id}})
    .fetch()
    .then(function(user) {
      if (!user) ctx.throw(401);

      var hasPassword = user.get('password');
      var out = user.omit('password');
      out.change_password = hasPassword !== '';

      ctx.body = out;
    });
}
exports.getProfile = getProfile;

/**
 * Response handler to update the authenticated
 * user's profile.
 */
function* updateProfile() {
  /* jshint validthis: true */
  var body = this.request.body;

  var user = yield User.query({where: {id: this.user.id}}).fetch();

  if (user.get('username') !== body.username && user.get('username').indexOf('@') >= 0) {
    if (body.username.indexOf('@') >= 0) {
      this.throw(409, 'Username must not contain @ in it');
    }
    var checkUser = yield User.query({where: {username: body.username}}).fetch();
    if (checkUser) {
      this.throw(409, 'Username already exists');
    }
    user.set('username', body.username);
  }
  user.set('name', body.name);

  if (body.password) {
    if (!body.current_password) this.throw(409, 'Must type in old password to update password');
    if (body.password !== body.confirm_password) this.throw(409, 'New password must match');
    if (body.password.length < 6) this.throw(409, 'Password must be at least 6 characters long');

    var match = yield user.passwordMatch(body.current_password);
    if (!match) this.throw(409, 'Current password was not correct');
    user.set('password', yield User.encryptPassword(body.password));
  }

  //Save the user
  user.save();

  var hasPassword = user.get('password');
  var out = user.omit('password');
  out.change_password = hasPassword !== '';

  this.body = out;
}
exports.updateProfile = updateProfile;

/**
 * Public method to submit a forgot password request.
 */
function* forgotPassword() {
  /* jshint validthis: true */
  this.status = 204;

  var body = this.request.body;

  if (!body.email || !/.+@.+\..+/.test(body.email)) {
    this.throw(409, 'Type in a valid email address');
  }

  var user = yield User.query({where: {email: body.email}}).fetch();
  if (!user) return;

  var text = emails.forgotPassword(
    user.get('name') || user.get('username'),
    config.get('server:url') + '/login/finish?token=' + jwt.sign({email: body.email, reset: true}, user.get('password') || user.get('email')),
    ip.getIp(this.req)
  );

  yield mailgun.send(body.email, 'NFP: Password Reset Confirmation', text);
}
exports.forgotPassword = forgotPassword;

/**
 * Very handy public method to verify tokens. Supports
 * both signup tokens and password reset tokens.
 *
 * Throws either a 409 or returns 204.
 */
function* verify() {
  /* jshint validthis: true */
  this.log.info('Verifying token from ' + ip.getIp(this.req));

  var body = this.request.body;
  console.log(body);
  var errorMessage = 'Invalid or expired token';

  if (!body.token) this.throw(409, errorMessage);
  var token = jwt.decode(body.token);

  if (!token || (!token.email && token.reset)) this.throw(409, errorMessage);

  var signature = '';

  this.user = yield User.query({where: {email: token.email}}).fetch();

  if (!this.user && token.reset) this.throw(409, errorMessage);
  if (token.signup) {
    if (this.user) this.throw(409, errorMessage);

    var checkName = yield User.query({where: {username: token.username}, orWhere: {name: token.name}}).fetch();
    if (checkName) this.throw(409, errorMessage);
  }

  if (token.reset) {
    signature = this.user.get('password') || this.user.get('email');
  }

  try {
    this.token = yield jwt.verify(body.token, signature);
  }
  catch (error) {
    this.log.warn('Signature failed or token expired');
    this.throw(409, errorMessage);
  }

  this.status = 204;
}
exports.verify = verify;

/**
 * Public method to finish either a user password reset
 * or a signup process. Requires a token to be valid and
 * not expired.
 */
function* finish() {
  /* jshint validthis: true */

  var body = this.request.body;

  //Make sure the password matches required length.
  if (!body.password || body.password.length < 6) {
    this.throw(409, 'Password must be at least 6 characters long.');
  }

  //Verify the token
  yield verify.call(this);

  //If we get here, reset the status code.
  this.status = 200;

  //Encrypt the new password and apply it to
  //to the user before saving.
  var password = yield User.encryptPassword(body.password);

  //Check if we're dealing with a password reset
  //token in the request.
  if (this.token.reset) {
    this.user.set('password', password);
    this.user.save();

    //Add the username to the body request.
    this.request.body.username = this.user.get('username');

    //With that we have a full body required to
    //login with the authenticate.
    return yield authentication.authenticate.call(this);
  }

  //Check if we're dealing with a signup token.
  if (this.token.signup) {
    this.log.info('Creating user', this.token.username, '(', this.token.email, ')');

    yield User.createUser({
      username: this.token.username.toLowerCase().trim(),
      name: this.token.name.trim(),
      email: this.token.email.toLowerCase().trim(),
      password: password,
      ip: ip.getIp(this.req),
      level: 10
    });

    //Add the username to the body request.
    this.request.body.username = this.token.username;

    //With that we have a full body required to
    //login with the authenticate.
    return yield authentication.authenticate.call(this);
  }
  this.log.warn('Token verification passed but was not a signup or reset token');
  this.throw(409, 'Invalid or expired token');
}
exports.finish = finish;

function* signup() {
  /* jshint validthis: true */
  this.status = 204;

  var body = this.request.body;

  if (!body.name || body.name.length < 1) {
    return this.throw(409, 'Name must be atleast 1 characters length');
  }

  if (!body.username || body.username.length < 2) {
    return this.throw(409, 'Username must be atleast 2 characters length');
  }

  if (body.username.indexOf('@') >= 0) {
    return this.throw(409, 'Username must not contain @.');
  }

  if (!body.email || !/.+@.+\..+/.test(body.email)) {
    return this.throw(409, 'Email must be valid');
  }

  var user = yield User.query({where: {username: body.username}, orWhere: {name: body.name}}).fetch();
  if (user) this.throw(409, 'Username or name is already taken');

  body.signup = true;

  delete body.files;

  var text = emails.signup(
    body.name || body.username,
    config.get('server:url') + '/login/finish?token=' + jwt.sign(body),
    ip.getIp(this.req)
  );

  yield mailgun.send(body.email, 'NFP: Signup Confirmation', text);
}
exports.signup = signup;
