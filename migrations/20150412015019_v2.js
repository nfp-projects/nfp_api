'use strict';

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('media', function(table) {
      table.increments();
      table.integer('user_id').references('users.id').notNullable();
      table.string('filename');
      table.string('filetype');
      table.string('thumb');
      table.json('meta', true);
      table.timestamps();
    }),
    knex.schema.createTable('permissions', function(table) {
      table.increments();
      table.integer('level').notNullable();
      table.string('permissions');
      table.timestamps();
    }),
    knex.schema.table('categories', function(table) {
      table.string('type');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('media'),
    knex.schema.dropTable('permissions'),
    knex.schema.table('categories', function(table) {
      table.dropColumn('type');
    })
  ]);
};
