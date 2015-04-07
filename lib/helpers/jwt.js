'use strict';

var bluebird = require('bluebird');
var jwt = require('jsonwebtoken');
var config = require('../config');
jwt.verifyAsync = bluebird.promisify(jwt.verify);

function sign(value, secret) {
  return jwt.sign(value, config.get('jwt:secret') + (secret || ''), config.get('jwt:options'));
}
exports.sign = sign;

function verify(token, secret) {
  return jwt.verifyAsync(token, config.get('jwt:secret') + (secret || ''), null);
}
exports.verify = verify;

function decode(token) {
  return jwt.decode(token);
}
exports.decode = decode;

function createUserToken(user) {
  return sign({
    id: user.id,
    level: 10 //user.get('level')
  });
}
exports.createUserToken = createUserToken;
