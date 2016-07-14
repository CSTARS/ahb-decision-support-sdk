var async = require('async');
var config = require('../config')();

var localstorage, db;
var storeKeyIds = {};
var requestCount = 0;


function init(next) {
    localstorage = window.localStorage;

    for( var i in config.localdb.stores ) {
      if( typeof config.localdb.stores[i] === 'string' ) {
        storeKeyIds[i] = config.localdb.stores[i];
      } else {
        storeKeyIds[i] = config.localdb.stores[i].key;
      }
    }
}

function add(store, obj, callback) {
  if( config.localdb.stores[store])
  var key = storeKeyIds[store].split('.');
  var id = getId(0, key, obj);

  localstorage.setItem(getStorageId(store, id), JSON.stringify(obj));
  callback();
}

function getId(index, key, obj) {
  if( index === key.length - 1) {
    return obj[key[index]];
  }

  var t = obj[key[index]];
  index++;
  return getId(index, key, t);
}

function getStorageId(store, id) {
  return `${store}::${id}`;
}

function addMany(store, array, callback) {
    var c = 0;
    async.forEach(
        array,
        (item, next) => {
            if( c % 100 === 0 ) {

            } else {

            }
            add(store, item, next, next)
        },
        callback
    );
}

function put(store, obj, callback) {
  add(store, obj, callback);
}

function get(store, id, callback) {
  callback(JSON.parse(localstorage.getItem(getStorageId(store, id))));
}

function find(store, index, value, next, done) {
  var storeRegex = new RegExp(store+'::');
  var key, i, len;

  var keys = [];
  for ( i = 0, len = localstorage.length; i < len; ++i ) {
    key = localStorage.key( i );
    if( key.match(storeRegex) ) {
      keys.push(key);
    }
  }

  async.eachSeries(
    keys,
    (key, callback) => {
      var data = JSON.parse(localStorage.getItem(key));
      // HACK, right now this is only used for selected parcels
      if( data.properties.ucd.selected ) {
        next(data, callback);
      } else {
        callback();
      }
    },
    done
  );
}

function forEach(store, next, done) {
  var storeRegex = new RegExp(store+'::');
  var key, i, len;

  var keys = [];
  for ( i = 0, len = localstorage.length; i < len; ++i ) {
    key = localStorage.key( i );
    if( key.match(storeRegex) ) {
      keys.push(key);
    }
  }

  async.eachSeries(
    keys,
    (key, callback) => {
      next(JSON.parse(localStorage.getItem(key)), callback);
    },
    done
  );
}

function clear(store, callback) {
  var storeRegex = new RegExp(store+'::');
  var key, i, len;

  for ( i = localstorage.length - 1; i > 0; --i ) {
    key = localStorage.key( i );
    if( key.match(storeRegex) ) {
      localstorage.removeItem(key);
    }
  }

  if( callback ) callback();
}

module.exports = {
    init : init,
    find : find,
    get : get,
    put : put,
    add : add,
    clear : clear,
    addMany : addMany,
    forEach: forEach
}