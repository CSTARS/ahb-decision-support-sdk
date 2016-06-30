var localdb = require('../localdb');
var events = require('../events');
var parcelCollection = require('./parcels');
var query = require('../rest/soil');

var DB_COLLECTION_NAME = 'soil';

function SoilCollection() {

  this.load = function(callback) {
    events.emit('soil-update-start');

    localdb.clear(DB_COLLECTION_NAME);

    var query = [];
    var pxLookup = [];

    // make sure the parcels are loaded first.
    // otherwise the arfiPxs will not be set
    for( var key in parcelCollection.afriPxs ) {
      pxLookup.push(key);
      query.push(this.afriPxs[key].join(','));
    }

    query.getAll(query, (err, soil) => {
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

        localdb.addMany(DB_COLLECTION_NAME, data, () => {
          events.emit('soil-update-end', msg);
          callback();
        });
      }
    });
  };

  this.get = function(afriPx, callback) {
    localdb.get(DB_COLLECTION_NAME, afriPx, callback);
  }

}

module.exports = new SoilCollection();