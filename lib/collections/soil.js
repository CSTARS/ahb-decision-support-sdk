var localdb = require('../localdb');
var events = require('../events');
var parcelCollection = require('./parcels');
var query = require('../rest/soil');

var DB_COLLECTION_NAME = 'soil';

function SoilCollection() {

  this.clear = function() {
    localdb.clear(DB_COLLECTION_NAME);
  }

  this.load = function(callback) {
    events.emit('soil-update-start');

    localdb.clear(DB_COLLECTION_NAME);

    var q = [];
    var pxLookup = [];

    // make sure the parcels are loaded first.
    // otherwise the arfiPxs will not be set
    for( var key in parcelCollection.afriPxs ) {
      pxLookup.push(key);
      q.push(parcelCollection.afriPxs[key].join(','));
    }

    query.getAll(q, (err, soil) => {
      var msg = {};

      if( err ) {
        msg.error = true;
        msg.message = err;
      } else {
        msg.success = true;

        var data = [];
        for( var i = 0; i < soil.length; i++ ) {
          data.push({
            id : pxLookup[i],
            data : JSON.stringify(soil[i])
          });
        }

        localdb.addMany(DB_COLLECTION_NAME, data);
        events.emit('soil-update-end', msg);
        if( callback ) callback();
      }
    });
  };

  this.get = function(afriPx) {
    return localdb.get(DB_COLLECTION_NAME, afriPx);
  }

}

module.exports = new SoilCollection();