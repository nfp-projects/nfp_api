'use strict';

var _ = require('lodash');
var config = require('./lib/config');

var out = {};

//This is important for setup to run cleanly.
var knexConfig = _.cloneDeep(config.get('knex'));
knexConfig.pool = { min: 1, max: 1};

out[config.get('NODE_ENV')] = knexConfig;

module.exports = out;
