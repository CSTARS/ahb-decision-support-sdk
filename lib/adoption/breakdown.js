var async = require('async');
var revenue = require('../revenue');

module.exports = function(datastore, farmBudgetSdk) {
  return function(options, callback) {
    var minPrice = options.minPrice;
    var maxPrice = options.maxPrice;
    var step = options.step;
    
    if( !step ) {
      step = 0.2;
    }
    

    var years = datastore.poplarModel.monthsToRun / 12;
    var requiredYield = datastore.selectedRefinery.feedstockCapacity.value * years;
    var minPoplarPrice = null;
    var results = [];

    var prices = [];
    for( var price = minPrice; price <= maxPrice; price += step ) {
      prices.push(parseFloat(price.toFixed(2)));
    }

    async.eachSeries(
      prices,
      function(price, next) {
        if( options.prescan && minPoplarPrice ) {
          return next();
        }

        var result = {
          price : price,
          poplar : {
            yield : 0,
            parcels : 0,
            acres : 0,
          },
          tmp : []
        };

        datastore.validParcels.forEach((parcel) => {
          if( !parcel.properties.ucd.harvest ) return;

          var ucd = parcel.properties.ucd;
          var years = ucd.harvest.years;
          var poplarCycle = [];

          var transportationCost = datastore.getTransportationCost(parcel); // per ton
          var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;
          var totalPoplarYield = 0; 

          ucd.harvest.harvests.forEach((y) => {
            if( isNaN(y) ) {
              return; 
            }
            
            totalPoplarYield += y * size;
            
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
          });
          
          // assuming 2 year harvest cycle
          // avgYield = avgYield / years;


          // TODO: check units
          var cropCycle = [[]];
          for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
            var priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);

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

          var farmRevenue = revenue.farm(years, poplarCycle, cropCycle);

          var crop = parcel.properties.ucd.cropInfo.swap.join(', ');
          if( !result[crop] )  {
            result[crop] = {parcels:0,acres:0};
          }
          
          if( farmRevenue.poplarRevenue > farmRevenue.cropsRevenue && requiredYield > result.poplar.yield ) {
            result.poplar.yield += totalPoplarYield;
            result.poplar.parcels++;
            result.poplar.acres += size;
            
            result.tmp.push({
              revenue: farmRevenue,
              selected : true
            });
          } else {
            result[crop].parcels++;
            result[crop].acres += size;
            
            result.tmp.push({
              revenue: farmRevenue,
              selected : false
            });
          }
        });
        
        // is this the first price that meets both required yield and ROI?
        if( minPoplarPrice === null && (result.poplar.yield >= requiredYield || price === maxPrice) ) {
          // this includes required ROI
          var totalCostAtPrice = revenue.refinery.requiredCost(datastore, result.poplar.yield, price);
          var income = revenue.refinery.income(datastore, result.poplar.yield);
          
          if( totalCostAtPrice < income || price === maxPrice ) {
            minPoplarPrice = price;
            
            if( !options.prescan ) {
              datastore.selectedParcels = [];
            
              datastore.validParcels.forEach((parcel, index) => {
                if( result.tmp[index].selected ) {
                  parcel.properties.ucd.revenueResults = result.tmp[index].revenue;
                  
                  // set price/yield data
                  parcel.properties.ucd.cropInfo.priceYield = [];
                  for( var i = 0; i < parcel.properties.ucd.cropInfo.swap.length; i++ ) {
                    var priceYield = datastore.getPriceAndYield(parcel.properties.ucd.cropInfo.swap[i]);
                    parcel.properties.ucd.cropInfo.priceYield.push(priceYield);
                  }
                  
                  datastore.selectedParcels.push(parcel);
                }
              });
              
              datastore.poplarPrice = price;
            }
            
          }
        }
        
        delete result.tmp;
        results.push(result);

        // delay for brower UI
        setTimeout(function(){
          next();
        },0);

      }.bind(this),
      function(err){
        callback({
          results : results,
          bestPoplarPrice : minPoplarPrice
        });
      }
    );
  };
};
