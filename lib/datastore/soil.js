var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getSoil = function(callback) {
    this.events.emit('soil-update-start');

    var xys = [];
    this.validParcels.forEach(function(parcel){
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

      for( var i = 0; i < this.validParcels.length; i++ ) {
        this.soil[this.validParcels[i].properties.PolyID] = soil[i];
      }

      this.events.emit('soil-update-end', msg);
      callback();
    }.bind(this));

  };
};
