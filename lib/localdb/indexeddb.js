var async = require('async');
var config = require('../config')();

var indexedDB, db;


function init(next) {
    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

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
            var tableConf = config.localdb.stores[key];

            // better ideas?
            try {
                db.deleteObjectStore(key);
            } catch(e) {}

            if( typeof tableConf === 'string' ) {
                db.createObjectStore(key, { keyPath: tableConf });
            } else {
                var objectStore = db.createObjectStore(key, { keyPath: tableConf.key });

                if( tableConf.indexes ) {
                    tableConf.indexes.forEach((index) => {
                        objectStore.createIndex(index.name, index.key, { unique: false });
                    });
                }
            }
            
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

function find(store, index, value, next, done) {
    var objectStore = db.transaction(store).objectStore(store);
    var singleKeyRange = IDBKeyRange.only(value);
    var index = objectStore.index(index);
    iterate(index, next, done, singleKeyRange);
}

function clear(store, onsuccess, onerror) {
    var request = db.transaction([store], "readwrite")
                .objectStore(store)
                .clear()
    setCallbacks(request, onsuccess, onerror);
}

function forEach(store, next, done) {
    var objectStore = db.transaction(store).objectStore(store);
    iterate(objectStore, next, done);
}

function iterate(storeOrIndex, next, done, query) {
    storeOrIndex.openCursor(query).onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
           next(cursor.value, () => {
               cursor.continue();
           });
        } else {
           done();
        }
    };
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
    find : find,
    get : get,
    put : put,
    add : add,
    clear : clear,
    addMany : addMany,
    forEach : forEach
}