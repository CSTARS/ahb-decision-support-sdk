var async = require('async');
//var lzbase62 = require('lzbase62');
var config = require('../config')();

var localstorage = {}, db;
var storeKeyIds = {};
var requestCount = 0;
var BREAK_COUNT = 100;


function init(next) {
    for( var i in config.localdb.stores ) {
      localstorage[i] = {};

      if( typeof config.localdb.stores[i] === 'string' ) {
        storeKeyIds[i] = config.localdb.stores[i];
      } else {
        storeKeyIds[i] = config.localdb.stores[i].key;
      }
    }
}

// function compress(obj) {
//   return lzbase62.compress(JSON.stringify(obj));
// }

// function decompress(str) {
//   if( !str ) return null;
//   return JSON.parse(lzbase62.decompress(str));
// }

// function compress(obj) {
//   return JSON.stringify(obj);
// }

// function decompress(str) {
//   if( !str ) return null;
//   return JSON.parse(str);
// }

function compress(obj) {
  return obj;
}

function decompress(str) {
  if( !str ) return null;
  return str;
}


function add(store, obj, callback) {
  if( config.localdb.stores[store])
  var key = storeKeyIds[store].split('.');
  var id = getId(0, key, obj);

  localstorage[store][id] = compress(obj);
  handleCallback(callback);
}

function getId(index, key, obj) {
  if( index === key.length - 1) {
    return obj[key[index]];
  }

  var t = obj[key[index]];
  index++;
  return getId(index, key, t);
}


function addMany(store, array, callback) {
    var c = 0;
    async.forEach(
        array,
        (item, next) => {
            add(store, item, next)
        },
        callback
    );
}

function put(store, obj, callback) {
  add(store, obj, callback);
}

function get(store, id, callback) {
  handleCallback(callback, decompress(localstorage[store][id]));
}

// this will not transpose to async interface like indexedDB
function getAllInline(store) {
  return localstorage[store];
}

function find(store, index, value, next, done) {
  var keys = Object.keys(localstorage[store]);

  async.eachSeries(
    keys,
    (key, callback) => {
      var data = decompress(localstorage[store][key]);

      // HACK, right now this is only used for selected parcels
      if( data.properties.ucd.selected ) {
        handleCallback(next, data, callback);
      } else {
        callback();
      }
    },
    done
  );
}

function forEach(store, next, done) {
  var keys = Object.keys(localstorage[store]);

  async.eachSeries(
    keys,
    (key, callback) => {
      handleCallback(next, decompress(localstorage[store][key]), callback);
    },
    done
  );
}

function clear(store, callback) {
  delete localstorage[store]
  localstorage[store] = {};

  handleCallback(callback);
}

function handleCallback(callback, param1, param2) {
  if( !callback ) return;
  requestCount++;
  if( requestCount % BREAK_COUNT === 0 ) {
    setTimeout(() => {
      callback(param1, param2);
    }, 0);
  } else {
    callback(param1, param2);
  }
}

module.exports = {
    init : init,
    find : find,
    get : get,
    put : put,
    add : add,
    clear : clear,
    addMany : addMany,
    forEach: forEach,
    getAllInline : getAllInline
}