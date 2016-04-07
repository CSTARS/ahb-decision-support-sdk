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
        this.weather[this.validParcels[i].properties.PolyID] = weather[i];
      }

      this.events.emit('weather-update-end', msg);
      callback();
    }.bind(this));

  };
};
