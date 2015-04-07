'use strict';

var _ = require('lodash');

function getAll(Model, param_mapper) {
  return function*() {
    /*jshint validthis: true*/
    var query = Model;
    if (param_mapper) {
      var keys = _.intersection(_.keys(this.params), _.keys(param_mapper));
      if (keys.length) {
        var where = {};

        for (var i = 0; i < keys.length; i++) {
          try {
            var item = yield param_mapper[keys[i]].getSingle(this.params[keys[i]]);  
            where[keys[i]] = item.id;
          }
          catch (error) {
            return;
          }
        }

        query = query.query({where: where});
      }
    }
    query = query.query('orderBy', 'sort', 'asc');
    this.body = yield query.fetchAll();
  };
}
exports.getAll = getAll;

function getSingle(Model, param_id) {
  return function*(should_return, id) {
    /*jshint validthis: true*/
    try {
      id = id || this.params[param_id];
      var res = yield Model.getSingle(id);
      if (should_return === true) {
        return res;
      }
      this.body = res;
    }
    catch (error) {
      return null;
    }
  };
}
exports.getSingle = getSingle;
