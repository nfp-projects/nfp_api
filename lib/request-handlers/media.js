'use strict';

var _ = require('lodash');
var fs = require('fs');
var base64 = require('base64-stream');
var handler = require('../helpers/handler');
var fileHelper = require('../helpers/file');
var Media = require('../repositories/media');
var config = require('../config');

var getMedias = handler.getAll(Media, null, {sort: 'id', filter: filter});
exports.getMedias = getMedias;

var getMedia = handler.getSingle(Media, 'media_id');

exports.getMedia = function* getOrShowMedia() {
  /* jshint validthis: true */
  var media = yield getMedia.call(this, true);

  if (this.params.media_id.indexOf('.') === -1) {
    this.body = media;
    return;
  }

  var file = config.get('uploads') + media.get('encid') + media.get('filename').slice(media.get('filename').lastIndexOf('.'));

  var stats = yield fs.statAsync(file);
  if (!stats) return null;
  if (!stats.isFile()) return null;

  this.response.lastModified = stats.mtime;
  this.response.length = stats.size;
  this.response.type = media.get('filetype');

  // fresh based solely on last-modified
  var fresh = this.request.fresh;
  switch (this.request.method) {
    case 'HEAD':
      this.response.status = fresh ? 304 : 200;
      break
    case 'GET':
      if (fresh) {
        this.response.status = 304;
      } else {
        this.body = fs.createReadStream(file);
      }
      break
  }
}

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
    filter(item);
    var outPath = config.get('uploads') + item.get('encid') + item.get('filename').slice(item.get('filename').lastIndexOf('.');
    moving.push(fileHelper.move(files[i].path, outPath))
      .then(function(path) {
        gm(path)
          .options({imageMagick: true})
          .equalize()
          .resize(200, 200)
          .stream()
          .pipe(base64.encode())
          .pipe(process.stdout)
      }.bind(null, outPath))
    );
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

function filter(media) {
  if (!media) return media;

  var encid = media.get('encid');
  var extension = media.get('filename').slice(media.get('filename').lastIndexOf('.'));
  media.set('links', {
    cover: config.get('server:api') + '/media/' + encid + extension,
    link: config.get('server:api') + '/media/' + encid + '/' + media.get('filename'),
    thumb: config.get('server:api') + '/media/' + encid + '.thumb' + extension,
  });

  return media;
}

