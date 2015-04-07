'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function(table) {
      table.dropColumn('status');
      table.integer('level').defaultTo(1);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', function(table) {
      table.enu('status', ['approved', 'pending', 'spam', 'trash']);
      table.dropColumn('level');
    })
  ]);
};
