var events = require('../events');
var localdb = require('../localdb');
var parcelCollection = require('./parcels');
var query = require('../rest/weather');

var DB_COLLECTION_NAME = 'weather';

function WeatherCollection() {

  this.clear = function() {
    localdb.clear(DB_COLLECTION_NAME);
  }

  this.load = function(callback) {
    events.emit('weather-update-start');

    localdb.clear(DB_COLLECTION_NAME);
    
    var q = [];
    var pxLookup = [];

    // make sure the parcels are loaded first
    var pxs = Object.keys(parcelCollection.afriPxs);
    pxs.sort();

    for( var i = 0; i < pxs.length; i++ ) {
      pxLookup.push(pxs[i]);
      q.push(parcelCollection.afriPxs[pxs[i]].join(','));
    }

    query.getAll(q, (err, weather) => {
      this._onWeatherLoad(pxLookup, err, weather);
      if( callback ) callback();
    });
  }

  this._onWeatherLoad = function(pxLookup, err, weather) {
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

      localdb.addMany(DB_COLLECTION_NAME, data);
      events.emit('weather-update-end', msg);
    }
  };

  this.get = function(afriPx) {
    return localdb.get(DB_COLLECTION_NAME, afriPx);
  }
}

// HACK: if we have bad weather data, return a good one
// array is in sorted order, hopefully we have an early hit so we get a 'close'
// good px.  
// Quinn.  If you have a chance, ge tyou fill out daylight for all px's in db?
function getWeather(index, array) {
  if( array[index][0].daylight !== null && array[index][0].rad !== null ) {
    return array[index];
  }

  for( var i = index+1; i < array.length; i++ ) {
    if( array[i][0].daylight !== null && array[i][0].rad !== null ) {
      return array[i];
    }
  }

  for( var i = index-1; i >= 0; i-- ) {
    if( array[i][0].daylight !== null && array[i][0].rad !== null ) {
      return array[i];
    }
  }

  return array[index];
}

module.exports = new WeatherCollection();