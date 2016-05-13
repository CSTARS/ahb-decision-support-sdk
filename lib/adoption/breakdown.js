var async = require('async');
var revenue = require('../revenue');
var refinery = require('./refinery');

module.exports = function(datastore, farmBudgetSdk, poplarModel) {
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
    var maxWillingToPay = 0;
    var results = [];

    var prices = [];
    for( var price = minPrice; price <= maxPrice; price += step ) {
      prices.push(parseFloat(price.toFixed(2)));
    }
    if( minPrice <= maxPrice ) {
      prices.push(parseFloat(maxPrice.toFixed(2)));
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
        var sortList = [];

        for( var z = 0; z < datastore.validParcels.length; z++) {
          var parcel = datastore.validParcels[z];
          if( !parcel.properties.ucd.harvest ) return;

          var ucd = parcel.properties.ucd;
          var years = ucd.harvest.years;
          var poplarCycle = [];

          var transportationCost = datastore.getTransportationCost(parcel); // per ton
          var waterCost = datastore.getWaterCost(parcel) * 0.3048; 
          var landCost = datastore.getLandCost(parcel);
          var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;
          var totalPoplarYield = 0;
          
          var mid = parcel.properties.ucd.modelProfileId;
          var irrigation = poplarModel.profiles[mid].totalIrrigation / years;

          for( var i = 0; i < ucd.harvest.harvests.length; i++ ) {
            var y = ucd.harvest.harvests[i];
            if( isNaN(y) ) {
              return; 
            }
            
            totalPoplarYield += y * size;
            
            var poplarHarvest = {
              size : size,
              cost : farmBudgetSdk.getPoplarTotal(),
              crop : 'poplar',
              transportation : transportationCost,
              water : waterCost * irrigation * 3.4,
              land : landCost,
              price : price,
              yield : y
            };
            var poplarOffyear = {
              size : size,
              cost : farmBudgetSdk.getPoplarTotal(),
              water : waterCost * irrigation * 3.4,
              land : landCost,
              crop : 'poplar',
              transportation : 0,
              price : 0,
              yield : 0
            };
            
            poplarCycle.push([poplarOffyear]);
            if( i > 0 ) {
              poplarCycle.push([poplarOffyear]);
            }
            poplarCycle.push([poplarHarvest]);
          };


          // TODO: check units
          // we only need to calculate the crops once
          var cropCycle;
          if( !ucd.cropInfo.cropCycle ) {
            ucd.cropInfo.cropCycle = [[]];
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

              ucd.cropInfo.cropCycle[0].push(crop);
            }
          }
          
          var farmRevenue;
          if( ucd.cropInfo.cropsRevenue ) { 
            farmRevenue = revenue.farm(years, poplarCycle);
            farmRevenue.cropsRevenue = ucd.cropInfo.cropsRevenue;
          } else {
            farmRevenue = revenue.farm(years, poplarCycle, ucd.cropInfo.cropCycle);
            ucd.cropInfo.cropsRevenue = farmRevenue.cropsRevenue;
          }

          var crop = parcel.properties.ucd.cropInfo.swap.join(', ');
          if( !result[crop] )  {
            result[crop] = {parcels:0,acres:0};
          }
          
          sortList.push({
            farmRevenue : farmRevenue,
            parcel: parcel,
            revenueDiff : farmRevenue.poplarRevenue - farmRevenue.cropsRevenue,
            crop : crop,
            totalPoplarYield : totalPoplarYield,
            size: size
          });
        };
        
        sortList.sort((a,b) => {
          if( a.revenueDiff > b.revenueDiff ) return 1;
          if( a.revenueDiff < b.revenueDiff ) return -1;
          return 0;
        });
        
        for( var i = 0; i < sortList.length; i++ ) {
          var item = sortList[i];
          var farmRevenue = item.farmRevenue;
          var crop = item.crop;
          var totalPoplarYield = item.totalPoplarYield;
          var size = item.size;
          
          if( farmRevenue.poplarRevenueAverage > 0 && farmRevenue.poplarRevenue > farmRevenue.cropsRevenue && requiredYield > result.poplar.yield ) {
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
        };
        
        // is this the first price that meets both required yield and ROI?
        if( minPoplarPrice === null && (result.poplar.yield >= requiredYield || price === maxPrice) ) {
          // this includes required ROI
          var totalCostAtPrice = revenue.refinery.requiredCost(datastore, result.poplar.yield, price);
          var income = revenue.refinery.income(datastore, result.poplar.yield);
          
          //
          if( totalCostAtPrice < income || price === maxPrice ) {
            minPoplarPrice = price;
            
            var r = datastore.selectedRefinery;
            var crf = refinery.crf(datastore.ROI, years);
            maxWillingToPay = refinery.mwp(r.product.price, r.yield.value, crf, r.capitalCost, r.operatingCost.value, r.feedstockCapacity.value);
            
            if( !options.prescan ) {
              datastore.selectedParcels = [];
            
              sortList.forEach((item, index) => {
                var parcel = item.parcel;
                parcel.properties.ucd.revenueResults = result.tmp[index].revenue;
                
                // set price/yield data
                parcel.properties.ucd.cropInfo.priceYield = [];
                for( var i = 0; i < parcel.properties.ucd.cropInfo.swap.length; i++ ) {
                  var priceYield = datastore.getPriceAndYield(parcel.properties.ucd.cropInfo.swap[i]);
                  parcel.properties.ucd.cropInfo.priceYield.push(priceYield);
                }
                
                if( result.tmp[index].selected ) {
                  datastore.selectedParcels.push(parcel);
                }
              });
              
              if( options.setPoplarPrice !== false ) {
                datastore.mwa = price;
                datastore.mwp = parseFloat(maxWillingToPay.toFixed(2));
                // no idea... split the difference?
                // market forces go herez
                datastore.poplarPrice = price;
                //datastore.poplarPrice = parseFloat((price + ((datastore.mwp - price) / 2)).toFixed(2));
              }
              
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
        if( err ) {
          debugger;
        }
        
        callback({
          results : results,
          minPoplarPrice : minPoplarPrice,
          maxPoplarPrice : maxWillingToPay,
          poplarPrice : minPoplarPrice
          //poplarPrice : minPoplarPrice + ((maxWillingToPay - minPoplarPrice) / 2)
        });
      }
    );
  };
};
