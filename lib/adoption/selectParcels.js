var utils = require('./utils');
var revenue = require('../revenue');

module.exports = function(datastore, farmBudgetSdk) {
  return function() {
    datastore.resetSelectedParcels();

    datastore.validParcels.forEach(function(parcel, index){
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
          transportation : transportationCost,
          crop : 'poplar',
          price : datastore.poplarPrice,
          yield : y
        };
        poplarCycle.push([]);
        poplarCycle.push([poplar]);
      });

      // TODO: check units
      var cropCycle = [[]];
      ucd.cropInfo.priceYield = [];

      for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
        var priceYield = utils.getPriceAndYield(datastore, ucd.cropInfo.swap[i], ucd.cropInfo.fips);

        ucd.cropInfo.priceYield.push(priceYield);

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
      parcel.properties.ucd.revenueResults = revenueResults;

      if( revenueResults.poplarRevenue > revenueResults.cropsRevenue ) {
        datastore.selectParcel(parcel);
      }
    });
  };
};
