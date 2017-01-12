var async = require('async');
var events = require('../events');
var query = require('../rest/transportation');

// will be injected later
var parcelsCollection;

function TransportationCollection() {
  this.TRUCK_MATERIAL = 'bulk';
  this.FUEL_COST = 3.88; // $/us_gal;
  this.TRUCK_LABOR = 12.95; // $/h
  this.DRIVERS_PER_TRUCK = 1.67;
  this.MILES_PER_GALLON = 6;
  this.OIL_ETC_COST = 0.29; // $/mile
  this.DRY_TON_TO_WET_TON = 2.32;

  this.network = {};
  this.networkUse = null;
  this.maxNetworkUse = 1;
  this.totalCost = 0;
  this.data = {};

  this.getTonsPerTruck = function(material) {
    if (material === 'bale') return 17; // tons/truck  @ 26 *  0.65445 tons/bale
    if (material === 'bulk') return 19.9; // tons/truck @ 9.1 lb / ft 3
    return 18.5;
  }

  // handle cyclical dependency
  this.inject = function(pc) {
     parcelsCollection = pc;
  }

  this.clear = function() {
    this.network = {};
    this.networkUse = null;
    this.maxNetworkUse = 1;
    this.totalCost = 0;
  }

  this.load = function(stop, routeGeometry, callback) {
    this.clear();
    events.emit('transportation-update-start');

    var startingPoints = [], start;
    for( var i = 0; i < parcelsCollection.centerPts.length; i++ ) {
      start = [parcelsCollection.centerPts[i][1], parcelsCollection.centerPts[i][0], parcelsCollection.centerPts[i][2]];
      startingPoints.push(start);
    }

    query.getAll(startingPoints, stop, routeGeometry, (err, resp) => {
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      if( resp.error ) {
        return console.log(resp.message);
      }

      this.network = {};

      resp.network.features.forEach(function(feature){
        feature.type = 'Feature';
        this.network[feature.properties.id] = feature;
      }.bind(this));

      this.networkUse = resp.use;
      this.maxNetworkUse = 1;
      for( var key in this.networkUse ) {
        if( this.networkUse[key] > this.maxNetworkUse ) {
          this.maxNetworkUse = this.networkUse[key];
        }
      }

      this.data = {};
      for( var i = 0; i < resp.paths.length; i++ ) {
        this.data[resp.paths[i].id] = resp.paths[i];
      }

      if( callback ) callback();
      events.emit('transportation-update-end');
    });
  }

  this.get = function(id) {
    return this.data[id];
  }

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

  events.on('get-transportation-routes', (e) => {
    e.handler(this.data);
  });

  events.on('get-transportation-paths', (e) => {
    e.handler(this.network);
  });

  events.on('get-transportation-route', (e) => {
    e.handler(this.get(e.id));
  });

  events.on('get-transportation-total-cost', (e) => {
    e.handler(this.totalCost);
  });

  events.on('get-transportation-tons-per-truck', (e) => {
    e.handler(this.getTonsPerTruck(e.material));
  });

  events.on('get-transportation-defaults', (e) => {
    e.handler({
        TRUCK_MATERIAL: this.TRUCK_MATERIAL,
        FUEL_COST: this.FUEL_COST,
        TRUCK_LABOR: this.TRUCK_LABOR,
        DRIVERS_PER_TRUCK: this.DRIVERS_PER_TRUCK,
        MILES_PER_GALLON: this.MILES_PER_GALLON,
        OIL_ETC_COST: this.OIL_ETC_COST,
        DRY_TON_TO_WET_TON: this.DRY_TON_TO_WET_TON
    });
  });
}

module.exports = new TransportationCollection();