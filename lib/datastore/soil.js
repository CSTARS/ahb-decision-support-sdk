var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getSoil = function(callback) {
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

        if( this.soil[id] ) {
          msg.success = true;
          msg.soil = this.soil[id];
          msg.cached = true;
          this.events.emit('soil-retrieved', msg);

          c++;
          return next();
        }

        var coord;
        if( parcel.geometry.type === 'Polygon' ) {
          coord = parcel.geometry.coordinates[0][0];
        } else if ( parcel.geometry.type === 'MultiPolygon' ) {
          coord = parcel.geometry.coordinates[0][0][0];
        } else {
          msg.error = true;
          msg.message = 'Unsupported geometry type: '+parcel.geometry.type;
          this.events.emit('soil-retrieved', msg);
          c++;
          return next();
        }

        this.rest.soil.get(coord[1], coord[0], function(err, soil){
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
