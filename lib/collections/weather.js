var events = require('../events');
var localdb = require('../localdb');
var parcelCollection = require('./parcels');
var query = require('../rest/weather');

var DB_COLLECTION_NAME = 'weather';

function WeatherCollection() {

  this.load = function() {
    events.emit('weather-update-start');

    localdb.clear(DB_COLLECTION_NAME);
    
    var query = [];
    var pxLookup = [];

    // make sure the parcels are loaded first
    for( var key in parcelCollection.afriPxs ) {
      pxLookup.push(key);
      query.push(parcelCollection.afriPxs[key].join(','));
    }

    query.getAll(query, (err, weather) => {
      var msg = {};

      if( err ) {
        msg.error = true;
        msg.message = err;
      } else {
        msg.success = true;

        var data = [];
        for( var i = 0; i < weather.length; i++ ) {
          data.push({
            id : pxLookup[i],
            data : JSON.stringify(getWeather(i, weather))
          });
        }

        localdb.addMany(DB_COLLECTION_NAME, data, () => {
          events.emit('weather-update-end', msg);
          callback();
        });
      }

    });
  }

  this.get = function(afriPx, callback) {
    localdb.get(DB_COLLECTION_NAME, afriPx, callback);
  }

}

return new WeatherCollection();