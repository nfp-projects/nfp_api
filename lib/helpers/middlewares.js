'use strict';

function* lockContent(next) {
  /* jshint validthis: true */
  var method = this.request.method;
  if (method !== 'GET' &&
      method !== 'DELETE' &&
      method !== 'OPTIONS' &&
      (!this.is('json') && !this.is('multipart/form-data'))) {
    this.log.info('Content type was invalid, was: ' + this.request.type);
    this.throw(400, 'Content type has to be application/json', {safe: true});
  }
  yield next;
}
exports.lockContent = lockContent;

function* parseBody(next) {
  /* jshint validthis: true */
  yield next;
  if (!this.body) return;
  if (this.body.toJSON) {
    this.body = this.body.toJSON();
  }
  if (this.body.map) {
    this.body = this.body.map(function(item) {
      if (item.toJSON) {
        return item.toJSON();
      }
      return item;
    });
  }
}
exports.parseBody = parseBody;


function* notFound(next) {
  /* jshint validthis: true */
  yield next;

  if (this.status === 404) {
    this.throw(404, 'Requested resource does not exist.');
  }
}
exports.notFound = notFound;