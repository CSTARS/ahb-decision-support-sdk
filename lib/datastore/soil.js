var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getSoil = function(callback) {

    var xys = [];
    this.parcels.forEach(function(parcel){
      xys.push(parcel.properties.ucd.center);
    });

    this.rest.soil.getAll(xys, function(err, soil){
      var msg = {};

      if( err ) {
        msg.error = true;
        msg.message = err;
      } else {
        msg.success = true;
      }

      for( var i = 0; i < this.parcels.length; i++ ) {
        this.soil[this.parcels[i].properties.PolyID] = soil[i];
      }

      this.events.emit('soil-retrieved', msg);
      callback();
    }.bind(this));

  };
};
