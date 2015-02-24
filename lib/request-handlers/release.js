'use strict';
exports.hello = hello;

function* hello() {
  /*jshint validthis: true */
  this.body = {message: 'Hello world'};
}
