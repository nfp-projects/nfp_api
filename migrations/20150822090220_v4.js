'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('media', function(table) {
      table.dropColumn('thumb');
      table.string('cover', 256 * 1024);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('media', function(table) {
      table.dropColumn('cover');
      table.string('thumb');
    })
  ]);
};
