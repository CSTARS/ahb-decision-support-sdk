var async = require('async');

var growthProfilesCollection = require('../../collections/growthProfiles');
var parcelController = require('../../controllers/parcels');
var transportationModel = require('../../models/transportation');
var incomeCalculator = require('./income');


module.exports = function(refineryCollection, callback) {
    prepare(refineryCollection, (prepareResults) => {
        onDataPrepared(refineryCollection, prepareResults, callback);
    });
}

function onDataPrepared(refineryCollection, prepareResults, callback) {
    var requiredYield = refineryCollection.selected.feedstockCapacity.value * growthProfilesCollection.years;
      
    var results = {
        count : 0,
        acres : 0,
        yield : 0,
        requiredYield : requiredYield,
        capacityReachedAt : -1
    }
    
    transportationModel.clearCost();

    parcelController.collection.selectedCount = 0;
    parcelController.collection.adoptionPrice = {
        min : Math.floor(prepareResults.minPrice),
        max : Math.ceil(prepareResults.maxPrice)
    }
    
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
            refineryCollection.selected.poplarPrice = parseFloat((poplarPrice+0.01).toFixed(2));
            parcelController.collection.mwa = refineryCollection.selected.poplarPrice;
            results.capacityReachedAt = i;
            refineryFull = true;
            return next();
        }

        i++;
        parcelController.collection.selectedCount++;

        parcelController.collection.get(props.id, (parcel) => {
            growthProfilesCollection.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {
                parcel.properties.ucd.selected = 1;
                growthProfile = JSON.parse(growthProfile.data);

                // add transportation cost
                transportationModel.sumCost(parcel);

                parcel.properties.ucd.income.poplar = incomeCalculator.poplar(refineryCollection.selected.poplarPrice, parcel, growthProfile);
        
                var diff = parcel.properties.ucd.refineryGateCost - prepareResults.minPrice;
                if( diff === 0 ) diff = 0.01;
                
                parcel.properties.ucd.adoptionPricePercentile = 1 - (Math.log(diff) / Math.log(parcelController.collection.adoptionPrice.max - parcelController.collection.adoptionPrice.min));
                //parcel.properties.ucd.adoptionPricePercentile = 1 - (diff / (maxPrice - minPrice));
                parcel.properties.ucd.adoptionPricePercentile = parseFloat(parcel.properties.ucd.adoptionPricePercentile.toFixed(2));

                parcelController.collection.update(parcel, next);
            });
        }, next);
        },
        (err) => {
            onComplete(results, refineryCollection, callback);
        }
    );
}

function onComplete(results, refineryCollection, callback) {
    // price not found
    if( results.capacityReachedAt === -1 ) {
        parcelController.collection.poplarPrice = refineryCollection.selected.maxWillingToPay;
        parcelController.collection.mwa = -1;
        results.capacityReachedAt = 0;
    }

    callback(results);
}

function prepare(refineryCollection, callback) {
    var sortList = [];
    var minPrice = 9999;
    var maxPrice = 0;

    async.eachSeries(
        parcelController.collection.validIds,
        (id, next) => {
            parcelController.collection.get(id, (parcel) => {
                growthProfilesCollection.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {
                    parcel.properties.ucd.selected = 0;

                    growthProfile = JSON.parse(growthProfile.data);

                    parcelController.setFarmCost(parcel, growthProfile);
            
                    parcel.properties.ucd.income = {
                        crops : incomeCalculator.crops(parcel)
                    }
                    
                    parcel.properties.ucd.adoptionPrice = calcAdoptionPrice(parcel, growthProfile);
                    
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
                    parcel.properties.ucd.transportationCost = transportationCost / growthProfile.data.totalPerAcre;
                    parcel.properties.ucd.refineryGateCost = parcel.properties.ucd.adoptionPrice + parcel.properties.ucd.transportationCost;
                    
                    if( parcel.properties.ucd.refineryGateCost < minPrice ) {
                        minPrice = parcel.properties.ucd.refineryGateCost;
                    }
                    if( parcel.properties.ucd.refineryGateCost > maxPrice ) {
                        maxPrice = parcel.properties.ucd.refineryGateCost;
                    }
                    
                    if( parcel.properties.ucd.refineryGateCost < refineryCollection.selected.maxWillingToPay ) {
                        sortList.push({
                            id : parcel.properties.id,
                            usableSize : parcel.properties.usableSize,
                            yield : parcel.properties.ucd.harvest.total,
                            adoptionPrice : parcel.properties.ucd.adoptionPrice,
                            refineryGateCost : parcel.properties.ucd.refineryGateCost
                        });
                    }

                    // save changes
                    parcelController.collection.update(parcel, next);
                });
            });
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

function calcAdoptionPrice(parcel, growthProfile) {
    var ucd = parcel.properties.ucd;
    
    var cropNet = ucd.income.crops.total - ucd.farmCost.crops.total;
    if( cropNet < 0 ) {
        return calcAdoptionPriceAboveZero(parcel, growthProfile);
    } else {
        return calcAdoptionPriceBeatsIncumbent(parcel, cropNet, growthProfile);
    }
}

function calcAdoptionPriceAboveZero(parcel, growthProfile) {
    var cropNet = 0; // hummm;
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = growthProfile.data.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}

function calcAdoptionPriceBeatsIncumbent(parcel, growthProfile) {
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = growthProfile.data.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}