var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getSoil = function(callback) {
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

        if( this.soil[id] ) {
          msg.success = true;
          msg.soil = soil;
          msg.cached = true;
          this.events.emit('soil-retrieved', msg);

          c++;
          return next();
        }

        var coord = parcel.geometry.coordinates[0][0];
        this.rest.soil.get(coord[0], coord[1], function(err, soil){
          if( err ) {
            msg.error = true;
            msg.message = err;
          } else{
            msg.success = true;
            msg.soil = soil;
          }

          this.soil[id] = soil;
          this.events.emit('soil-retrieved', msg);

          c++;
          next();
        }.bind(this));
        //PolyID
      }.bind(this),
      function(err){
        callback(this.soil);
        this.events.emit('soil-updated', this.soil);
      }.bind(this)
    );
  };
};
