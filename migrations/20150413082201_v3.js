'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('media', function(table) {
      table.string('encid');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('media', function(table) {
      table.dropColumn('encid');
    })
  ]);
};
