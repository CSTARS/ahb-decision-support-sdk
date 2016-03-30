var events = require('events').EventEmitter;
var revenue = require('../revenue');


function DataStore(farmBudgetSdk) {
  var rest = require('../rest')(farmBudgetSdk);

  this.parcels = []; // all parcels in current range
  this.selectedParcels = []; // selected parcels in current range
  // weather by parcel id
  this.weather = {};
  // soil by parcel id
  this.soil = {};

  this.lat = 0;
  this.lng = 0;
  this.radius = 0;
  this.poplarPrice = 24;

  this.events = new events();
  this.rest = rest;

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

      this.parcels = features;
      this.selectedParcels = [];

      // set a center point
      this.parcels.forEach(function(parcel){
        this.getPointForFeature(parcel);
      }.bind(this));

      if( callback ) callback(null, features);
      this.events.emit('parcels-update-end', features);
    }.bind(this), this.events);
  };

  this.getCrops = function(callback) {
    this.events.emit('crops-update-start');
    rest.crops.getAll(this.parcels, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }

      var prop;
      for( var i = 0; i < resp.length; i++ ) {
        prop = this.parcels[i].properties.ucd;
        prop.crop = resp[i].crop;
        prop.state = resp[i].state;
        prop.price = resp[i].price;
        prop.yield = resp[i].yield;
      }

      if( callback ) callback();
      this.events.emit('crops-update-end');
    }.bind(this));
  };

  this.getBudgets = function(callback) {
    this.events.emit('budgets-update-start');
    rest.budgets.getAll(this.parcels, function(err, resp){
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

  this.selectParcels = function() {
    this.resetSelectedParcels();

    this.parcels.forEach(function(parcel){
      if( !parcel.properties.ucd.harvest ) return;
      if( !parcel.properties.ucd.cropBudget ) return;

      var ucd = parcel.properties.ucd;
      var years = ucd.harvest.years;
      var poplarCycle = [];

      ucd.harvest.harvests.forEach(function(y){
        var poplar = {
          cost : farmBudgetSdk.getPoplarTotal(),
          crop : 'poplar',
          price : this.poplarPrice,
          yield : y
        };
        poplarCycle.push([]);
        poplarCycle.push([poplar]);
      }.bind(this));

      // BADNESS
      if( !parcel.properties.ucd.price ) {
        parcel.properties.ucd.price = {
          value : 20,
          units : '$ / TON'
        };
      }

      // TODO: check units
      var cropCycle = [[]];
      var crop = {
        price : parcel.properties.ucd.price.value,
        yield : parcel.properties.ucd.yield.value,
        yieldUnits : parcel.properties.ucd.yield.units,
        crop : parcel.properties.ucd.crop,
        cost : parcel.properties.ucd.cropBudget.budget.total
      };
      cropCycle[0].push(crop);

      var revenueResults = revenue(years, poplarCycle, cropCycle);
      parcel.properties.ucd.revenueResults = revenueResults;

      if( revenueResults.poplarRevenue > revenueResults.cropsRevenue ) {
        this.selectParcel(parcel);
      }
    }.bind(this));
  };

  this.getAdoptionBreakdown = function(minPrice, maxPrice, step) {
    if( !step ) {
      step = 0.2;
    }

    var results = [];

    for( var price = minPrice; price <= maxPrice; price += step ) {
      var result = {
        price : price,
        poplar : {
          parcels : 0,
          acres : 0
        }
      };

      this.parcels.forEach(function(parcel){

        if( !parcel.properties.ucd.harvest ) return;
        if( !parcel.properties.ucd.cropBudget ) return;

        var ucd = parcel.properties.ucd;
        var years = ucd.harvest.years;
        var poplarCycle = [];

        ucd.harvest.harvests.forEach(function(y){
          var poplar = {
            cost : farmBudgetSdk.getPoplarTotal(),
            crop : 'poplar',
            price : price,
            yield : y
          };
          poplarCycle.push([]);
          poplarCycle.push([poplar]);
        }.bind(this));

        // TODO: check units
        var cropCycle = [[]];
        var crop = {
          price : parcel.properties.ucd.price.value,
          yield : parcel.properties.ucd.yield.value,
          yieldUnits : parcel.properties.ucd.yield.units,
          crop : parcel.properties.ucd.crop,
          cost : parcel.properties.ucd.cropBudget.budget.total
        };
        cropCycle[0].push(crop);

        var revenueResults = revenue(years, poplarCycle, cropCycle);
        var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;

        if( revenueResults.poplarRevenue > revenueResults.cropsRevenue ) {
          result.poplar.parcels++;
          result.poplar.acres += size;
        } else {
          if( !result[parcel.properties.ucd.crop] )  {
            result[parcel.properties.ucd.crop] = {parcels:0,acres:0};
          }
          result[parcel.properties.ucd.crop].parcels++;
          result[parcel.properties.ucd.crop].acres += size;
        }

      }.bind(this));

      results.push(result);
    }

    return results;
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
      var lng = 0; lat = 0;
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

module.exports = DataStore;
