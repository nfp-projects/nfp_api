'use strict';

var bluebird = require('bluebird');
var Mailgun = require('mailgun').Mailgun;
var config = require('../config');

var mg = new Mailgun(config.get('mailgun:config:apikey'));

//Promisify fs
bluebird.promisifyAll(mg);

exports.send = function(to, subject, content) {
  return mg.sendTextAsync(
  	config.get('mailgun:from'),
  	to,
  	subject,
  	content);
};
