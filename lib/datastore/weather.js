var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getWeather = function(callback) {
    var c = 0;
    async.eachSeries(
      this.parcels,
      function(parcel, next) {
        var id = parcel.properties.PolyID;

        var msg = {
          id : id,
          count : c,
          total : this.parcels.length
        };

        var coord;
        if( parcel.geometry.type === 'Polygon' ) {
          coord = parcel.geometry.coordinates[0][0];
        } else if ( parcel.geometry.type === 'MultiPolygon' ) {
          coord = parcel.geometry.coordinates[0][0][0];
        } else {
          msg.error = true;
          msg.message = 'Unsupported geometry type: '+parcel.geometry.type;
          this.events.emit('weather-retrieved', msg);

          c++;
          return next();
        }

        this.rest.weather.get(coord[1], coord[0], function(err, weather, cached){
          if( err ) {
            msg.error = true;
            msg.message = err;
          } else {
            msg.success = true;
            msg.weather = weather;
            msg.cached = cached;
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
