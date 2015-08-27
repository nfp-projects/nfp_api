'use strict';

var _ = require('lodash');
var fs = require('fs');
var base64 = require('base64-stream');
var handler = require('../helpers/handler');
var fileHelper = require('../helpers/file');
var Media = require('../repositories/media');
var config = require('../config');
var sharp = require('sharp');

var getMedias = handler.getAll(Media, null, {sort: 'id', filter: filter});
exports.getMedias = getMedias;

var getMedia = handler.getSingle(Media, 'media_id');

exports.getMedia = function* getOrShowMedia() {
  /* jshint validthis: true */
  var media = yield getMedia.call(this, true);

  var file = config.get('uploads') + media.get('encid') + media.get('filename').slice(media.get('filename').lastIndexOf('.'));

  try
  {
    var stats = yield fs.statAsync(file);
    if (!stats) media.status = media.set('status', 'File Error');;
    if (!stats.isFile()) media.status = media.set('status', 'File Error');;
    media.set('status', 'Ok');
  }
  catch (e)
  {
    media.set('status', 'File Error');
  }

  this.body = filter(media);

  return;
};

exports.downloadMedia = function* downloadMedia() {
  /* jshint validthis: true */
  var media = yield getMedia.call(this, true);

  this.log.info(this.params.filename);

  //if (media.get('filename') !== this.params.filename) {
  //  return null;
  //}

  var file = config.get('uploads') + media.get('encid') + media.get('filename').slice(media.get('filename').lastIndexOf('.'));

  try
  {
    var stats = yield fs.statAsync(file);
    if (!stats) return null;
    if (!stats.isFile()) return null;
  }
  catch (e)
  {
    return null;
  }

  this.response.set('Content-Disposition', 'inline; filename="' + media.get('filename') + '"');
  this.response.lastModified = stats.mtime;
  this.response.length = stats.size;
  this.response.type = media.get('filetype');

  // fresh based solely on last-modified
  var fresh = this.request.fresh;
  switch (this.request.method) {
    case 'HEAD':
      this.response.status = fresh ? 304 : 200;
      break;
    case 'GET':
      if (fresh) {
        this.response.status = 304;
      } else {
        this.body = fs.createReadStream(file);
      }
      break
  }
};

function* createMedia() {
  /*jshint validthis: true*/
  var that = this;
  var body = this.request.body;

  if (!body.files) this.throw(409, 'Missing files in POST request');

  var files = _.values(body.files);

  this.log.info(_.pluck(files, 'name'), 'Uploaded files');

  var moving = [];

  for (var i = 0; i < collection.length; i++) {
    var item = collection.at(i);
    filter(item);
    var outPath = config.get('uploads') + item.get('encid') + item.get('filename').slice(item.get('filename').lastIndexOf('.'));
    moving.push(fileHelper.move(files[i].path, outPath))
      .then(function(path) {
        //image
      }.bind(null, outPath));
  }

  yield Promise.all(moving);

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

  //yield Promise.all(collection.invoke('save'));

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
  media.set('slug', encid);
  media.set('links', {
    cover: config.get('server:api') + '/media/' + encid + '/cover.jpg',
    link: config.get('server:api') + '/media/' + encid + '/' + media.get('filename'),
    thumb: config.get('server:api') + '/media/' + encid + '/thumb.jpg',
  });
  return media;
}

