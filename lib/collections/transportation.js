var events = require('../events');
var parcelsCollection = require('./parcels');
var query = require('../rest/transportation');

function TransportationCollection() {

  // TODO: move this to indexeddb
  this.network = {};
  this.networkUse = null;
  this.maxNetworkUse = 1;
  this.totalCost = 0;

  this.clear = function() {
    this.network = {};
    this.networkUse = null;
    this.maxNetworkUse = 1;
    this.totalCost = 0;
  }

  this.load = function(routeGeometry, callback) {
    events.emit('transportation-update-start');
    var stop = [this.lat, this.lng];

    var startingPoints = [], start;
    for( var i = 0; i < parcelsCollection.centerPts.length; i++ ) {
      start = [parcelsCollection.centerPts[i][1], parcelsCollection.centerPts[i][0], parcelsCollection.centerPts[i][2]];
      startingPoints.push(start);
    }

    // return socket.io client connection so update events
    // can be recorded
    // TODO: just pipe the events to new global event bus
    return query.getAll(startingPoints, stop, routeGeometry, (err, resp) => {
      if( err ) {
        if( callback ) callback(err);
        return;
      }

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

      async.eachSeries(
        resp.paths,
        (path, next) => {

          parcelsCollection.get(path.id, (parcel) => {
            parcel.properties.ucd.transportation = path;
            parcelsCollection.update(parcel, next);
          });

        },
        () => {
          if( callback ) callback();
          events.emit('transportation-update-end');
        }
      );
    });
  };

  this.getNetworkPath = function(feature) {
    var collections = {
      type : 'FeatureCollection',
      features : []
    };

    if( !feature.path ) return collections;

    feature.path.forEach(function(id){
      collection.features.push(this.network[id]);
    }.bind(this));

    return collection;
  };
}

module.exports = new TransportationCollection();