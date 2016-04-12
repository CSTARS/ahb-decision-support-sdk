var utils = require('./utils');
var revenue = require('../revenue');

module.exports = function(datastore, farmBudgetSdk) {
  return function(minPrice, maxPrice, step) {
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

      datastore.validParcels.forEach(function(parcel){
        if( !parcel.properties.ucd.harvest ) return;

        var ucd = parcel.properties.ucd;
        var years = ucd.harvest.years;
        var poplarCycle = [];

        var transportationCost = datastore.getTransportationCost(parcel); // per ton
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
        for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
          var priceYield = utils.getPriceAndYield(datastore, ucd.cropInfo.swap[i], ucd.cropInfo.fips);

          var crop = {
            size : size,
            price : priceYield.price.price,
            priceUnits : priceYield.price.unit,
            yield : priceYield.yield.unspecified || priceYield.yield['non-irrigated'],
            yieldUnits : priceYield.yield.unit,
            crop : ucd.cropInfo.swap[i],
            cost : ucd.cropInfo.cropBudgets[i].budget.total
          };

          cropCycle[0].push(crop);
        }

        var revenueResults = revenue(years, poplarCycle, cropCycle);

        var crop = parcel.properties.ucd.cropInfo.swap.join(', ');
        if( !result[crop] )  {
          result[crop] = {parcels:0,acres:0};
        }

        if( revenueResults.poplarRevenue > revenueResults.cropsRevenue ) {
          result.poplar.parcels++;
          result.poplar.acres += size;
        } else {
          result[crop].parcels++;
          result[crop].acres += size;
        }

      }.bind(this));

      results.push(result);
    }

    return results;
  };
};
