var events = require('events').EventEmitter;
var md5 = require('md5');


function DataStore(farmBudgetSdk) {
  var rest = require('../rest')(farmBudgetSdk);

  this.allParcels = []; // all parcels in current range
  this.validParcels = []; // parcels with valid crop types
  this.selectedParcels = []; // selected parcels in current range

  // weather by parcel id
  this.weather = {};
  // soil by parcel id
  this.soil = {};

  this.lat = 0;
  this.lng = 0;
  this.radius = 0;

  this.selectedRefinery = null;
  this.ROI = 0.10;

  this.poplarPrice = 24;
  this.pastureConversion = 0.25;
  this.priceYield =  {
    data : {},
    factored : {},
    currentValues : {}
  };

  this.events = new events();
  this.rest = rest;
  
  this.setSelectedRefinery = function(name) {
    rest.refinery.getAll((refineries) => {
      refineries.forEach((r) => {
        if( r.name === name ) {
          this.selectedRefinery = r;
        }
      });
    });
  }
  
  this.getAllRefineries = function(callback) {
    rest.refinery.getAll(callback);
  }
  
  this.setTotals = function() {
    var totalAcres = 0;
    var totalHarvested = 0;
    var years = this.poplarModel.monthsToRun / 12;
    var cropCounts = {};
    
    this.selectedParcels.forEach(function(parcel){
      var harvest = parcel.properties.ucd.harvest;
      if( !harvest ) return;

      totalAcres += harvest.growArea;
      totalHarvested += harvest.totalHarvest;

      parcel.properties.ucd.cropInfo.swap.forEach(function(name){
        if( cropCounts[name] === undefined ) {
          cropCounts[name] = 0;
        }
        cropCounts[name]++;
      });
    });
    
    this.totals = {
      acres : totalAcres,
      harvested : totalHarvested,
      years : years,
      cropCounts : cropCounts,
      avgYearHarvest : totalHarvested / years
    }
  }

  this.getParcelById = function(id) {
    for( var i = 0; i < this.allParcels.length; i++ ) {
      if( this.allParcels[i].properties.PolyID === id ) {
        return this.allParcels[i];
      }
    }
    return null;
  };

  this.getParcels = function(lat, lng, radius, callback) {
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;

    this.events.emit('parcels-update-start');
    rest.parcels.get(lat, lng, radius, function(err, features){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      this.allParcels = features;
      this.validParcels = [];
      this.selectedParcels = [];

      // set a center point
      this.allParcels.forEach(function(parcel){
        this.getPointForFeature(parcel);
      }.bind(this));

      if( callback ) callback(null, features);

      this.events.emit('parcels-update-end', features);
    }.bind(this), this.events);
  };

  this.getBudgets = function(callback) {
    this.events.emit('budgets-update-start');
    rest.budgets.getAll(this.validParcels, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      if( callback ) callback();
      this.events.emit('budgets-update-end');
    }.bind(this));
  };

  this.resetSelectedParcels = function() {
    this.selectedParcels = [];
  };

  this.getPoplarTotal = function() {
    return farmBudgetSdk.getPoplarTotal();
  };


  this.selectParcel = function(parcel) {
    if( this.selectedParcels.indexOf(parcel) === -1 ) {
      this.selectedParcels.push(parcel);
    }
  };

  // help for getting a useful point from a feature.
  // currently just using the first point in the polygon
  this.getPointForFeature = function(feature) {
    var coords;
    if( feature.geometry.type === 'Polygon' ) {
      coords = feature.geometry.coordinates[0];
    } else if ( feature.geometry.type === 'MultiPolygon' ) {
      coords = feature.geometry.coordinates[0][0];
    }

    if( coords ) {
      var lng = 0, lat = 0;
      for( var i = 0; i < coords.length; i++ ) {
        lng += coords[i][0];
        lat += coords[i][1];
      }
      lng = lng / coords.length;
      lat = lat / coords.length;
      feature.properties.ucd.center = [lng, lat];
      return feature.properties.ucd.center;
    }


    throw(new Error('Unsupported feature type'));
  };

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };
}

require('./weather')(DataStore);
require('./soil')(DataStore);
require('./transportation')(DataStore);
require('./crops')(DataStore);

module.exports = DataStore;
