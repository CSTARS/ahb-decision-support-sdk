var async = require('async');

var growthProfilesCollection = require('../../collections/growthProfiles');
var parcelController = require('../../controllers/parcels');
var transportationModel = require('../../models/transportation');
var refineryIncomeCalculator = require('./income');
var events = require('../../events');

module.exports = function(refineryCollection, options, callback) {
    if( typeof options === 'function' ) {
        callback = options;
        options = {};
    }
    
    events.emit('optimize-start');


    prepare(refineryCollection, options, (prepareResults) => {
        onDataPrepared(refineryCollection, options, prepareResults, callback);
    });
}

function onDataPrepared(refineryCollection, options, prepareResults, callback) {
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
        min : Math.floor(prepareResults.adoptionPrice.min),
        max : Math.ceil(prepareResults.adoptionPrice.max)
    };

    parcelController.collection.refineryGatePrice = {
        min : Math.floor(prepareResults.refineryGatePrice.min),
        max : Math.ceil(prepareResults.refineryGatePrice.max)
    };
    
    var poplarPrice = -1;
    var refineryGatePrice = -1;
    var refineryFull = false;
    var i = 0;
    var slidingScaleTotal = 0;

    async.eachSeries(
        prepareResults.sortList,
        (props, next) => {
            if( props.pastureIgnore ) {
                parcelController.collection.get(props.id, (parcel) => {
                    parcel.properties.ucd.pastureIgnored = true;

                    parcelController.collection.update(parcel, () => {
                        next();
                    });
                });
                return;
            }

            if( refineryFull ) {
                return next();
            }

            if( results.yield > requiredYield ) {
                // refineryCollection.selected.poplarPrice = parseFloat((poplarPrice+0.01).toFixed(2));
                refineryCollection.selected.poplarPrice = parseFloat((refineryGatePrice+0.01).toFixed(2));
                refineryCollection.selected.refineryGatePrice = parseFloat((refineryGatePrice+0.01).toFixed(2));
                parcelController.collection.mwa = refineryCollection.selected.poplarPrice;
                results.capacityReachedAt = i;
                refineryFull = true;
                return next();
            }

            results.count++;
            results.acres += props.usableSize;
            results.yield += props.yield;

            slidingScaleTotal += props.slidingScalePrice;

            if( props.adoptionPrice > poplarPrice ) {
                poplarPrice = props.adoptionPrice;
            }
            if( props.refineryGatePrice > refineryGatePrice ) {
                refineryGatePrice = props.refineryGatePrice;
            }

            i++;
            parcelController.collection.selectedCount++;

            parcelController.collection.get(props.id, (parcel) => {
                parcel.properties.ucd.selected = 1;

                parcelController.collection.update(parcel, () => {
                    next();
                });
            });
        },
        (err) => {
            results.maxPoplar = poplarPrice;
            results.maxRefineryGatePrice = refineryGatePrice;
            results.slidingScaleTotal = slidingScaleTotal;

            onComplete(results, refineryCollection, options, callback);
        }
    );
}

function setAdoptionPrecentile(parcel) {
    var diff = parcel.properties.ucd.refineryGateCost - parcelController.collection.refineryGatePrice.min;
    if( diff === 0 ) diff = 0.001;

    parcel.properties.ucd.adoptionPricePercentile = diff / (parcelController.collection.refineryGatePrice.max - parcelController.collection.refineryGatePrice.min);
    var t = parcel.properties.ucd.adoptionPricePercentile.toFixed(2);
    parcel.properties.ucd.adoptionPricePercentile = parseFloat(t);
}

function onComplete(results, refineryCollection, options, callback) {
    // price not found
    if( results.capacityReachedAt === -1 ) {
        refineryCollection.selected.refineryGatePrice = refineryCollection.selected.maxWillingToPay;
        refineryCollection.selected.poplarPrice = refineryCollection.selected.maxWillingToPay;
        parcelController.collection.mwa = -1;
        results.capacityReachedAt = 0;
    }

    if( options.setPoplarPrice ) {
        refineryCollection.selected.poplarPrice = options.setPoplarPrice;
    }

    refineryCollection.selected.slidingPoplarPriceTotal = results.slidingScaleTotal;

    postProcess(refineryCollection, callback);
}

function postProcess(refineryCollection, callback) {
    var count = 0;
    var total = parcelController.collection.validIds.length;
    transportationModel.clearCost();

    async.eachSeries(
        parcelController.collection.validIds,
        (id, next) => {
            count++;
            events.emit('optimize-update', (0.5 + (0.5 * (count / total))));


            parcelController.collection.get(id, (parcel) => {
                growthProfilesCollection.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {
                    // add transportation cost
                    if( parcel.properties.ucd.selected ) {
                        transportationModel.sumCost(parcel);
                    }

                    parcel.properties.ucd.income.poplar = refineryIncomeCalculator.poplar(refineryCollection.selected.poplarPrice, parcel, growthProfile);

                    setAdoptionPrecentile(parcel);

                    parcelController.collection.update(parcel, () => {
                        next();
                    });
                });
            });
        },
        () => {
            events.emit('optimize-end');
            callback(results);
        }
    );
}

function prepare(refineryCollection, options, callback) {
    var sortList = [];

    var minRGatePrice = 9999;
    var maxRGatePrice = 0;
    var minFarmAdoptionPrice = 9999;
    var maxFarmAdoptionPrice = 0;

    var count = 0;
    var total = parcelController.collection.validIds.length;


    function updateMinMax(properties) {
        var rCost = properties.refineryGatePrice || properties.refineryGateCost;

        if( properties.adoptionPrice < minFarmAdoptionPrice ) {
            minFarmAdoptionPrice = properties.adoptionPrice;
        }
        if( properties.adoptionPrice > maxFarmAdoptionPrice ) {
            maxFarmAdoptionPrice = properties.adoptionPrice;
        }

        if( rCost < minRGatePrice ) {
            minRGatePrice = rCost;
        }
        if( rCost > maxRGatePrice ) {
            maxRGatePrice = rCost;
        }
    }

    async.eachSeries(
        parcelController.collection.validIds,
        (id, next) => {
            count++;
            events.emit('optimize-update', (0.5 * (count / total)));

            parcelController.collection.get(id, (parcel) => {
                growthProfilesCollection.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {
                    parcel.properties.ucd.selected = 0;
                    parcel.properties.ucd.pastureIgnored = false;

                    parcelController.setFarmCost(parcel, growthProfile);
            
                    parcel.properties.ucd.income = {
                        crops : refineryIncomeCalculator.crops(parcel)
                    }

                    // price for farm to switch to poplar
                    parcel.properties.ucd.adoptionPrice = calcAdoptionPrice(parcel, growthProfile);

                    // cost of poplar at refinery gate
                    var transportationCost = parcel.properties.ucd.farmCost.poplar.totalTransportationCost / growthProfile.data.totalPerAcre;
                    parcel.properties.ucd.refineryGateCost = parcel.properties.ucd.adoptionPrice + transportationCost;
                    parcel.properties.ucd.slidingScalePrice = parcel.properties.ucd.refineryGateCost + (parcel.properties.ucd.refineryGateCost * (options.pricePercent || 0.10));

                    var candidate = false;
                    // if we are manually setting the poplar price at refinery gate, is the price greater than our refinery gate cost
                    if( options.setPoplarPrice && parcel.properties.ucd.refineryGateCost < options.setPoplarPrice) {
                        candidate = true;
                    } else if( !options.setPoplarPrice && parcel.properties.ucd.refineryGateCost < refineryCollection.selected.maxWillingToPay ) {
                        candidate = true;
                    }

                    if( parcel.properties.ucd.refineryGateCost > refineryCollection.selected.maxWillingToPay ) {
                        parcel.properties.ucd.aboveRefineryWillingToPay = true;
                    } else {
                        parcel.properties.ucd.aboveRefineryWillingToPay = false;
                    }


                    if( candidate ) {
                        updateMinMax(parcel.properties.ucd);

                        sortList.push({
                            id : parcel.properties.id,
                            usableSize : parcel.properties.usableSize,
                            yield : growthProfile.data.totalPerAcre * parcel.properties.usableSize,
                            adoptionPrice : parcel.properties.ucd.adoptionPrice,
                            pasture : parcel.properties.ucd.cropInfo.pasture,
                            refineryGatePrice : parcel.properties.ucd.refineryGateCost,
                            slidingScalePrice : parcel.properties.ucd.slidingScalePrice
                        });
                    }

                    // save changes
                    parcelController.collection.update(parcel, () => {
                        next();
                    });
                });
            });
        },
        () => {
            sortList.sort((a, b) => {
                if( a.refineryGatePrice > b.refineryGatePrice ) {
                    return 1;
                }
                if( a.refineryGatePrice < b.refineryGatePrice ) {
                    return -1;
                }
                return 0;
            });

            var pastureCount = 0;
            for( var i = 0; i < sortList.length; i++ ) {
                if( sortList[i].pasture ) pastureCount++;
            }

            var maxPasture = Math.ceil(refineryCollection.selected.maxPastureLandAdoption * pastureCount);
            var removeCount = pastureCount - maxPasture;

            // console.log(`${pastureCount} ${maxPasture} ${removeCount}`);

            // recalc our min/max with newly ignored parcels
            minRGatePrice = 9999;
            maxRGatePrice = 0;
            minFarmAdoptionPrice = 9999;
            maxFarmAdoptionPrice = 0;

            for( var i = sortList.length-1; i >= 0; i-- ) {
                if( sortList[i].pasture && removeCount > 0 ) {
                    removeCount--;
                    sortList[i].pastureIgnore = true;
                } else {
                    updateMinMax(sortList[i]);
                }
            }

            callback({
                sortList: sortList,
                adoptionPrice : {
                    min : minFarmAdoptionPrice,
                    max : maxFarmAdoptionPrice
                },
                refineryGatePrice : {
                    min : minRGatePrice,
                    max : maxRGatePrice
                }
            });
        }
    );
}


function log(m) {
    console.log(m);
}

/**
 * We are comparing total cost for 1 acre of incumbent crop v poplar crop
 */
function calcAdoptionPrice(parcel, growthProfile) {
    var ucd = parcel.properties.ucd;
    
    var cropNet = ucd.income.crops.total - ucd.farmCost.crops.totalFarmGateCost;
    if( cropNet < 0 ) {
        return calcAdoptionPriceAboveZero(parcel, growthProfile);
    } else {
        return calcAdoptionPriceBeatsIncumbent(parcel, cropNet, growthProfile);
    }
}

function calcAdoptionPriceAboveZero(parcel, growthProfile) {
    var cropNet = 0; // hummm;
    var poplarCost = parcel.properties.ucd.farmCost.poplar.totalFarmGateCost;
    var poplarYield = growthProfile.data.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}

function calcAdoptionPriceBeatsIncumbent(parcel, cropNet, growthProfile) {
    var poplarCost = parcel.properties.ucd.farmCost.poplar.totalFarmGateCost;
    var poplarYield = growthProfile.data.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;

    return requirePrice;
}