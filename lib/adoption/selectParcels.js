var revenue = require('../revenue');

module.exports = function(datastore, farmBudgetSdk, poplarModel) {
  return function() {
    datastore.resetSelectedParcels();
    
    var totalYield = 0;
    var years = datastore.poplarModel.monthsToRun / 12;
    var requiredYield = datastore.selectedRefinery.feedstockCapacity.value * years;

    datastore.validParcels.forEach(function(parcel, index){
      if( !parcel.properties.ucd.harvest ) return;

      var ucd = parcel.properties.ucd;
      var years = ucd.harvest.years;
      var poplarCycle = [];
      var waterCost = datastore.getWaterCost(parcel) * 0.3048; 
      var transportationCost = datastore.getTransportationCost(parcel); // per ton
      var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;
      var parcelYield = 0;
      
      var mid = parcel.properties.ucd.modelProfileId;
      var irrigation = poplarModel.profiles[mid].totalIrrigation / years;

      ucd.harvest.harvests.forEach(function(y, i){
        if( isNaN(y) ) {
          ucd.poplarGrowthError = true;
        }
        
        parcelYield += y * size;

        var poplar = {
          size : size,
          cost : farmBudgetSdk.getPoplarTotal(),
          transportation : transportationCost,
          crop : 'poplar',              
          water : waterCost * irrigation * 3.4,
          price : datastore.poplarPrice,
          yield : isNaN(y) ? 0 : y
        };
        var poplarOffyear = {
          size : size,
          cost : farmBudgetSdk.getPoplarTotal(),
          water : waterCost * irrigation * 3.4,
          crop : 'poplar',
          transportation : 0,
          price : 0,
          yield : 0
        };
        poplarCycle.push([poplarOffyear]);
        if( i > 0 ) {
          poplarCycle.push([poplarOffyear]);
        }
        poplarCycle.push([poplar]);
      });
      

      // TODO: check units
      var cropCycle = [[]];
      ucd.cropInfo.priceYield = [];

      for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
        var priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);

        ucd.cropInfo.priceYield.push(priceYield);

        var crop = {
          size : size,
          price : priceYield.price.price,
          priceUnits : priceYield.price.unit,
          yield : priceYield.yield.yield,
          yieldUnits : priceYield.yield.unit,
          crop : ucd.cropInfo.swap[i],
          cost : ucd.cropInfo.cropBudgets[i].budget.total
        };
        cropCycle[0].push(crop);
      }


      var revenueResults = revenue.farm(years, poplarCycle, cropCycle);
      parcel.properties.ucd.revenueResults = revenueResults;

      if( totalYield + parcelYield < requiredYield ) {
        if( revenueResults.poplarRevenue > revenueResults.cropsRevenue ) {
          totalYield += totalYield;
          datastore.selectParcel(parcel);
        }
      }
    });
  };
};
