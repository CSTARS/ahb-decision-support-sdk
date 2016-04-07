var events = require('events').EventEmitter;
var revenue = require('../revenue');
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

  this.getCrops = function(callback) {
    this.events.emit('crops-update-start');

    this.validParcels = [];
    rest.crops.getAll(this.allParcels, function(err, resp, geoms){
      if( err ) {
        if( callback ) callback(err);
        return;
      }



      var notFound = 0;
      var duplicates = 0;

      var lookup = {};
      resp.forEach(function(item){
        if( lookup[item.id] ) {
          duplicates++;
        } else {
          lookup[item.id] = item;
        }
      });

      geoms.forEach(function(geom){
        var id = md5(JSON.stringify({type: geom.type, coordinates: geom.coordinates}));
        if( !lookup[id] ) {
          notFound++;
        }
      });

      console.log('notFound='+notFound+' duplicates='+duplicates);

      var prop;
      for( var i = 0; i < resp.length; i++ ) {
        if( i >= this.allParcels.length ) {
          break; // hack
        }
        prop = this.allParcels[i].properties.ucd;
        prop.cropInfo = resp[i];
        prop.state = resp[i].state;

        for( var j = 0; j < prop.cropInfo.dwr.length; j++ ) {
          if( prop.cropInfo.dwr[j].swap ) {
            this.validParcels.push(this.allParcels[i]);
            break;
          }
        }
      }

      if( callback ) callback();
      this.events.emit('crops-update-end');
    }.bind(this));
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

  this.selectParcels = function() {
    this.resetSelectedParcels();

    this.validParcels.forEach(function(parcel){
      if( !parcel.properties.ucd.harvest ) return;

      var ucd = parcel.properties.ucd;
      var years = ucd.harvest.years;
      var poplarCycle = [];
      var transportationCost = this.getTransportationCost(parcel); // per ton
      var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;

      ucd.harvest.harvests.forEach(function(y){
        var poplar = {
          size : size,
          cost : farmBudgetSdk.getPoplarTotal(),
          transportation : transportationCost,
          crop : 'poplar',
          price : this.poplarPrice,
          yield : y
        };
        poplarCycle.push([]);
        poplarCycle.push([poplar]);
      }.bind(this));



      // TODO: check units
      var cropCycle = [[]];
      for( var i = 0; i < ucd.cropInfo.dwr.length; i++ ) {
        var crop = {
          size : size,
          // HACK TODO: change to price!
          price : ucd.cropInfo.yield[i],
          yield : ucd.cropInfo.nonirrigated_yield[i],
          yieldUnits : ucd.cropInfo.unit[i],
          crop : ucd.cropInfo.dwr[i].crop,
          cost : ucd.cropInfo.dwr[i].cropBudget.budget.total
        };
        cropCycle[0].push(crop);
      }


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

      this.validParcels.forEach(function(parcel){
        if( !parcel.properties.ucd.harvest ) return;

        var ucd = parcel.properties.ucd;
        var years = ucd.harvest.years;
        var poplarCycle = [];

        var transportationCost = this.getTransportationCost(parcel); // per ton
        var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;

        ucd.harvest.harvests.forEach(function(y){
          var poplar = {
            size : size,
            cost : farmBudgetSdk.getPoplarTotal(),
            crop : 'poplar',
            transportation : transportationCost,
            price : price,
            yield : y
          };
          poplarCycle.push([]);
          poplarCycle.push([poplar]);
        }.bind(this));

        // TODO: check units
        var cropCycle = [[]];
        for( var i = 0; i < ucd.cropInfo.dwr.length; i++ ) {
          var crop = {
            size : size,
            // HACK TODO: change to price!
            price : ucd.cropInfo.yield[i],
            yield : ucd.cropInfo.nonirrigated_yield[i],
            yieldUnits : ucd.cropInfo.unit[i],
            crop : ucd.cropInfo.dwr[i].crop,
            cost : ucd.cropInfo.dwr[i].cropBudget.budget.total
          };
          cropCycle[0].push(crop);
        }

        var revenueResults = revenue(years, poplarCycle, cropCycle);


        if( revenueResults.poplarRevenue > revenueResults.cropsRevenue ) {
          result.poplar.parcels++;
          result.poplar.acres += size;
        } else {
          var crop = parcel.properties.ucd.cropInfo.dwr.map(function(item){
            return item.crop;
          });
          crop = crop.join(', ');

          if( !result[crop] )  {
            result[crop] = {parcels:0,acres:0};
          }
          result[crop].parcels++;
          result[crop].acres += size;
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
