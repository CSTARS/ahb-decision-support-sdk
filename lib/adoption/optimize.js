var async = require('async');

var setCost = require('../cost');
var incomeCalculator = require('../income');
var farmBudgetSdk = require('../budget');
var datastore = require('../datastore');
var poplarModel = require('../poplar');
var localdb = require('../localdb');

module.exports = function(options, callback) {
    
    prepare((prepareResults) => {
      var requiredYield = datastore.selectedRefinery.feedstockCapacity.value * poplarModel.years;
      
      var results = {
          count : 0,
          acres : 0,
          yield : 0,
          requiredYield : requiredYield,
          capacityReachedAt : -1
      }
      
      var props;
      datastore.selectedParcelsCount = 0;
      
      var poplarPrice = -1;
      var refineryFull = false;
      var i = 0;

      async.eachSeries(
          prepareResults.sortList,
          (props, next) => {
            if( refineryFull ) {
                return next();
            }

            results.count++;
            results.acres += props.usableSize;
            results.yield += props.yield;


            if( props.adoptionPrice > poplarPrice ) {
                poplarPrice = props.adoptionPrice;
            }
            
            if( results.yield > requiredYield ) {
                datastore.poplarPrice = parseFloat((poplarPrice+0.01).toFixed(2));
                datastore.mwa = datastore.poplarPrice;
                results.capacityReachedAt = i;
                refineryFull = true;
                return next();
            }

            i++;
            datastore.selectedParcelsCount++;

            localdb.get('parcels', props.id, (parcel) => {
                parcel.properties.ucd.selected = true;

                parcel.properties.ucd.income.poplar = incomeCalculator.poplar(datastore.poplarPrice, parcel, datastore);
        
                var diff = parcel.properties.ucd.refineryGateCost - prepareResults.minPrice;
                if( diff === 0 ) diff = 0.01;
                
                parcel.properties.ucd.adoptionPricePercentile = 1 - (Math.log(diff) / Math.log(prepareResults.maxPrice - prepareResults.minPrice));
                //parcel.properties.ucd.adoptionPricePercentile = 1 - (diff / (maxPrice - minPrice));
                parcel.properties.ucd.adoptionPricePercentile = parseFloat(parcel.properties.ucd.adoptionPricePercentile.toFixed(2));

                localdb.put('parcels', parcel, next, next);
            }, next);
          },
          (err) => {
              onComplete(results, callback);
          }
      );
    });
}

function onComplete(results, callback) {
    // price not found
    if( results.capacityReachedAt === -1 ) {
        datastore.poplarPrice = datastore.selectedRefinery.maxWillingToPay;
        datastore.mwa = -1;
        results.capacityReachedAt = 0;
    }

    callback(results);
}

function prepare(callback) {
    var sortList = [];
    var minPrice = 9999;
    var maxPrice = 0;

    datastore.validParcelsCount = 0;

    localdb.forEach(
        'parcels',
        (parcel, next) => {
            parcel.properties.ucd.selected = false;
            datastore.validParcelsCount++;

            setCost(parcel, datastore); 
       
            parcel.properties.ucd.income = {
                crops : incomeCalculator.crops(parcel, datastore)
            }
            
            parcel.properties.ucd.adoptionPrice = calcAdoptionPrice(parcel);
            
            if( parcel.properties.ucd.adoptionPrice < minPrice ) {
                minPrice = parcel.properties.ucd.adoptionPrice;
            }
            if( parcel.properties.ucd.adoptionPrice > maxPrice ) {
                maxPrice = parcel.properties.ucd.adoptionPrice;
            }
            
            var transportationCost = 0;
            for( var j = 0; j < parcel.properties.ucd.farmCost.poplar.yearlyData.length; j++ ) {
            transportationCost += parcel.properties.ucd.farmCost.poplar.yearlyData[j].transportation;
            }
            parcel.properties.ucd.transportationCost = transportationCost / parcel.properties.ucd.harvest.totalPerAcre;
            parcel.properties.ucd.refineryGateCost = parcel.properties.ucd.adoptionPrice + parcel.properties.ucd.transportationCost;
            
            if( parcel.properties.ucd.refineryGateCost < minPrice ) {
                minPrice = parcel.properties.ucd.refineryGateCost;
            }
            if( parcel.properties.ucd.refineryGateCost > maxPrice ) {
                maxPrice = parcel.properties.ucd.refineryGateCost;
            }
            
            if( parcel.properties.ucd.refineryGateCost < datastore.selectedRefinery.maxWillingToPay ) {
                sortList.push({
                    id : parcel.properties.id,
                    usableSize : parcel.properties.usableSize,
                    yield : parcel.properties.ucd.harvest.total,
                    adoptionPrice : parcel.properties.ucd.adoptionPrice,
                    refineryGateCost : parcel.properties.ucd.refineryGateCost
                });
            }

            // save changes
            localdb.put('parcels', parcel, next, next);
        },
        () => {
            sortList.sort((a, b) => {
                if( a.refineryGateCost > b.refineryGateCost ) {
                    return 1;
                }
                if( a.refineryGateCost < b.refineryGateCost ) {
                    return -1;
                }
                return 0;
            });

            callback({
                sortList: sortList,
                minPrice: minPrice,
                maxPrice: maxPrice
            });
        }
    );
}


function log(m) {
    console.log(m);
}

function calcAdoptionPrice(parcel) {
    var ucd = parcel.properties.ucd;
    
    var cropNet = ucd.income.crops.total - ucd.farmCost.crops.total;
    if( cropNet < 0 ) {
        return calcAdoptionPriceAboveZero(parcel);
    } else {
        return calcAdoptionPriceBeatsIncumbent(parcel, cropNet);
    }
}

function calcAdoptionPriceAboveZero(parcel) {
    var cropNet = 0; // hummm;
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = parcel.properties.ucd.harvest.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}

function calcAdoptionPriceBeatsIncumbent(parcel, cropNet) {
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = parcel.properties.ucd.harvest.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}