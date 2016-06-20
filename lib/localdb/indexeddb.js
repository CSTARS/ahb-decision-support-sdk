var async = require('async');
var config = require('../config')();

var indexedDB, db;


function init(next) {
    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    var request = indexedDB.open(config.indexeddb.name, config.indexeddb.version);
    request.onerror = function(event) {
        console.log('Failed to open indexeddb!!');
        console.log(event);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        next();
    };

    request.onupgradeneeded = function(event) { 
        var db = event.target.result;
        for( var key in config.localdb.stores ) {
            var objectStore = db.createObjectStore(key, { keyPath: config.localdb.stores[key] });
        }
    };
}

function add(store, obj, onsuccess, onerror) {
    var request = db.transaction([store], "readwrite")
                .objectStore(store)
                .add(obj);
    setCallbacks(request, onsuccess, onerror);
}

function addMany(store, array, callback) {
    async.forEach(
        array,
        (item, next) => {
            add(store, item, next, next)
        },
        callback
    );
}

function put(store, obj, onsuccess, onerror) {
    var request = db.transaction([store], "readwrite")
                .objectStore(store)
                .put(obj);
    setCallbacks(request, onsuccess, onerror);
}

function get(store, id, onsuccess, onerror) {
    var request = db.transaction([store])
                .objectStore(store)
                .get(id);
    setCallbacks(request, onsuccess, onerror);
}

function clear(store, onsuccess, onerror) {
    var request = db.transaction([store], "readwrite")
                .objectStore(store)
                .clear()
    setCallbacks(request, onsuccess, onerror);
}

function setCallbacks(request, onsuccess, onerror) {
    if( onerror ) {
        request.onerror = onerror;
    }
    if( onsuccess ) {
        request.onsuccess = function(){
            onsuccess(request.result);
        };
    }
}

module.exports = {
    init : init,
    get : get,
    put : put,
    add : add,
    clear : clear,
    addMany : addMany
}