'use strict';

var fs = require('fs');

function move (oldPath, newPath) {
  return new Promise(function(resolve, reject) {
    fs.renameAsync(oldPath, newPath).then(resolve, function (err) {
      if (err.code === 'EXDEV') {
        copy();
      } else {
        reject(err);
      }
    });

    function copy () {
      var readStream = fs.createReadStream(oldPath);
      var writeStream = fs.createWriteStream(newPath);
      readStream.on('error', reject);
      writeStream.on('error', reject);
      readStream.on('close', function () {
        fs.unlinkAsync(oldPath).then(resolve, reject);
      });
      readStream.pipe(writeStream);
    }
  });
}

exports.move = move;
