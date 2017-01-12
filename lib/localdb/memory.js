var config = require('../config')();

var localstorage = {}, db;
var storeKeyIds = {};
var requestCount = 0;
var BREAK_COUNT = 100;


function init() {
  for( var i in config.localdb.stores ) {
    localstorage[i] = {};

    if( typeof config.localdb.stores[i] === 'string' ) {
      storeKeyIds[i] = config.localdb.stores[i];
    } else {
      storeKeyIds[i] = config.localdb.stores[i].key;
    }
  }
}


function add(store, obj) {
  // if( config.localdb.stores[store] )
  var key = storeKeyIds[store].split('.');
  var id = getId(0, key, obj);

  localstorage[store][id] = obj;
}

function getId(index, key, obj) {
  if( index === key.length - 1) {
    return obj[key[index]];
  }

  var t = obj[key[index]];
  index++;
  return getId(index, key, t);
}


function addMany(store, array) {
  array.forEach((item) => {
    add(store, item);
  });
}

function put(store, obj) {
  add(store, obj);
}

function get(store, id) {
  return localstorage[store][id];
}

function getAll(store) {
  return localstorage[store];
}

// function find(store, index, value, next, done) {
//   var keys = Object.keys(localstorage[store]);

//   async.eachSeries(
//     keys,
//     (key, callback) => {
//       var data = decompress(localstorage[store][key]);

//       // HACK, right now this is only used for selected parcels
//       if( data.properties.ucd.selected ) {
//         handleCallback(next, data, callback);
//       } else {
//         callback();
//       }
//     },
//     done
//   );
// }

// function forEach(store, next, done) {
//   var keys = Object.keys(localstorage[store]);

//   async.eachSeries(
//     keys,
//     (key, callback) => {
//       handleCallback(next, decompress(localstorage[store][key]), callback);
//     },
//     done
//   );
// }

function clear(store) {
  delete localstorage[store]
  localstorage[store] = {};
}

module.exports = {
    init : init,
    get : get,
    put : put,
    add : add,
    clear : clear,
    addMany : addMany,
    getAll : getAll
}