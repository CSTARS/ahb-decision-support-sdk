var IndexedDB = require('./indexeddb');
var LocalStorage = require('./localstorage');
var MemoryDB = require('./memory');
var db;

if( typeof window !== 'undefined' ) {
    // if( window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB ) {
    //     db = IndexedDB;
    // }
    
    // if( window.localStorage ) {
    //     db = LocalStorage;
    // }
}

if( !db ) {
    db = MemoryDB;
}

db.init(function(){
    console.log('Local db ready');
});

module.exports = db;