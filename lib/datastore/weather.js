var async = require('async');
var localdb = require('../localdb');

module.exports = function(DataStore) {
  DataStore.prototype.getWeather = function(callback) {
    this.events.emit('weather-update-start');

    localdb.clear('weather');

    for( var key in this.afriPxs ) {
       query.push(this.afriPxs[key].join(','));
    }

    this.rest.weather.getAll(query, (err, weather) => {
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

        localdb.addMany('weather', data, () => {
          this.events.emit('weather-update-end', msg);
          callback();
        });
      }

    });

  };
};

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
