var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getWeather = function(callback) {
    var c = 0;

    var xys = [];
    this.parcels.forEach(function(parcel){
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

      for( var i = 0; i < this.parcels.length; i++ ) {
        this.weather[this.parcels[i].properties.PolyID] = weather[i];
      }

      this.events.emit('weather-retrieved', msg);
      callback();
    }.bind(this));

  };
};
