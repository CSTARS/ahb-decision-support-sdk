var events = require('../events');
var localdb = require('../localdb');
var parcelCollection = require('./parcels');
var query = require('../rest/weather');

var DB_COLLECTION_NAME = 'weather';

function WeatherCollection() {

  this.load = function(callback) {
    events.emit('weather-update-start');

    localdb.clear(DB_COLLECTION_NAME);
    
    var q = [];
    var pxLookup = [];

    // make sure the parcels are loaded first
    for( var key in parcelCollection.afriPxs ) {
      pxLookup.push(key);
      q.push(parcelCollection.afriPxs[key].join(','));
    }

    query.getAll(q, (err, weather) => {
      this._onWeatherLoad(pxLookup, err, weather, callback);
    });
  }

  this._onWeatherLoad = function(pxLookup, err, weather, callback) {
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
  };

  this.get = function(afriPx, callback) {
    localdb.get(DB_COLLECTION_NAME, afriPx, callback);
  }
}

// HACK: if we have bad weather data, return a good one
function getWeather(index, array) {
  if( array[index][0].daylight !== null && array[index][0].rad !== null ) {
    return array[index];
  }

  for( var i = 0; i < array.length; i++ ) {
    if( array[i][0].daylight !== null && array[i][0].rad !== null ) {
      return array[i];
    }
  }

  return array[index];
}

module.exports = new WeatherCollection();