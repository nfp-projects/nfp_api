'use strict';

var _ = require('lodash');
var handler = require('../helpers/handler');
var fileHelper = require('../helpers/file');
var Media = require('../repositories/media');
var config = require('../config');

var getMedias = handler.getAll(Media, null, {sort: 'id'});
exports.getMedias = getMedias;

var getMedia = handler.getSingle(Media, 'media_id');
exports.getMedia = getMedia;

function* createMedia() {
  /*jshint validthis: true*/
  var that = this;
  var body = this.request.body;

  if (!body.files) this.throw(409, 'Missing files in POST request');

  var files = _.values(body.files);

  this.log.info(_.pluck(files, 'name'), 'Uploaded files');

  var collection = Media.Collection().forge(files.map(function(file) {
    return {
      user_id: that.user.id,
      filename: file.name,
      filetype: file.type,
      thumb: null,
      meta: {
        size: file.size
      }
    }
  }));

  yield Promise.all(collection.invoke('save'));

  var moving = [];

  for (var i = 0; i < collection.length; i++) {
    var item = collection.at(i);
    moving.push(fileHelper.move(files[i].path, config.get('uploads') + item.get('encid') + item.get('filename').slice(item.get('filename').lastIndexOf('.'))));
  }

  yield Promise.all(moving);

  this.body = collection;
}
exports.createMedia = createMedia;

function* deleteMedia() {
  /* jshint validthis: true */
  var media = yield getMedia.call(this, true);

  if (!media) return;

  media.destroy();

  this.status = 204;
}
exports.deleteMedia = deleteMedia;