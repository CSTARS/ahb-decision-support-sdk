module.exports = function(DataStore) {

  DataStore.prototype.getTransportation = function(socketId, callback) {
    if( typeof socketId === 'function' ) {
      callback = socketId;
      socketId = undefined;
    }

    this.events.emit('transportation-update-start');
    var stop = [this.lat, this.lng];

    console.log(this.validParcels.length);

    var startingPoints = [];
    this.validParcels.forEach(function(parcel){
      var start = parcel.properties.ucd.center;
      start = [start[1], start[0]];
      startingPoints.push(start);
    }.bind(this));

    this.rest.transportation.getAll(startingPoints, stop, socketId, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }
      resp = resp.body;

      if( resp.error ) {
        return console.log(resp.message);
      }

      this.network = {};
      resp.network.features.forEach(function(feature){
        this.network[feature.properties.id] = feature;
      }.bind(this));

      this.networkUse = resp.use;
      this.maxNetworkUse = 1;
      for( var key in this.networkUse ) {
        if( this.networkUse[key] > this.maxNetworkUse ) {
          this.maxNetworkUse = this.networkUse[key];
        }
      }

      for( var i = 0; i < resp.paths.features.length; i++ ) {
        this.validParcels[i].properties.ucd.transportation = resp.paths.features[i];
      }

      if( callback ) callback();
      this.events.emit('transportation-update-end');
    }.bind(this));
  };

  DataStore.prototype.getNetworkPath = function(feature) {
    var collections = {
      type : 'FeatureCollection',
      features : []
    };

    feature.properties.path.forEach(function(id){
      collection.features.push(this.network[id]);
    }.bind(this));

    return collection;
  };
};
