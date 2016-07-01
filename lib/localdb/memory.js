var async = require('async');

var data = {};

function init(next) {
  next();
}

function add(store, obj, callback) {
  if( !data[store] ) {
    data[store] = {};
  }
  data[store][obj.id] = obj;
  callback();
}

function addMany(store, array, callback) {
    async.forEach(
        array,
        (item, next) => {
            add(store, item, callback)
        },
        callback
    );
}

function put(store, obj, callback) {
  add(store, obj, callback);
}

function get(store, id, callback) {
  if( !data[store] ) {
    return callback();
  }

  callback(data[store][id]);
}

// TODO: fix this
function find(store, index, value, callback, done) {
    var keys = Object.keys(data[store]);

  async.eachSeries(
    keys,
    (key, next) => {
      callback(data[store][key], next);
    },
    done
  );
}

function clear(store, callback) {
  data[store] = null;
  callback();
}

function forEach(store, callback, done) {
  var keys = Object.keys(data[store]);

  async.eachSeries(
    keys,
    (key, next) => {
      callback(data[store][key], next);
    },
    done
  );
}

module.exports = {
    init : init,
    find : find,
    get : get,
    put : put,
    add : add,
    clear : clear,
    addMany : addMany,
    forEach : forEach
}