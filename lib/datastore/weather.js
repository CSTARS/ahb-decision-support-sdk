var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getWeather = function(callback) {
    var c = 0;
    async.eachSeries(
      this.parcels,
      function(parcel, next) {
        var id = parcel.properties.PolyID;
        var msg = {
          PolyID : id,
          count : c,
          total : this.parcels.length
        };

        if( this.weather[id] ) {
          msg.success = true;
          msg.weather = this.weather[id];
          msg.cached = true;
          this.events.emit('weather-retrieved', msg);

          c++;
          return next();
        }

        var coord = parcel.geometry.coordinates[0][0];
        this.rest.weather.get(coord[0], coord[1], function(err, weather){
          if( err ) {
            msg.error = true;
            msg.message = err;
          } else{
            msg.success = true;
            msg.weather = weather;
          }

          this.weather[id] = weather;
          this.events.emit('weather-retrieved', msg);

          c++;
          next();
        }.bind(this));
        //PolyID
      }.bind(this),
      function(err){
        callback(this.weather);
        this.events.emit('weather-updated', this.weather);
      }.bind(this)
    );
  };
};
