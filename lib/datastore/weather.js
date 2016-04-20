var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getWeather = function(callback) {
    this.events.emit('weather-update-start');

    var xys = [];
    this.validParcels.forEach(function(parcel){
      xys.push(parcel.properties.ucd.center);
    });

    this.rest.weather.getAll(xys, function(err, weather){
      var msg = {};

      if( err ) {
        msg.error = true;
        msg.message = err;
      } else {
        msg.success = true;
      }

      for( var i = 0; i < this.validParcels.length; i++ ) {
        this.weather[this.validParcels[i].properties.PolyID] = getWeather(i, weather);
      }

      this.events.emit('weather-update-end', msg);
      callback();
    }.bind(this));

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
