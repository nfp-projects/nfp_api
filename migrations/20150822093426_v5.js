'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('media', function(table) {
      table.string('thumb', 32 * 1024);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('media', function(table) {
      table.string('thumb');
    })
  ]);
};
