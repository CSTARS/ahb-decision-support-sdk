var async = require('async');

var growthProfilesCollection = require('../../collections/growthProfiles');
var parcelController = require('../../controllers/parcels');
var transportationModel = require('../../models/transportation');
var incomeCalculator = require('./income');
var events = require('../../events');

var debug = {};

module.exports = function(refineryCollection, callback) {
    events.emit('optimize-start');

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


    async.eachSeries(
        prepareResults.sortList,
        (props, next) => {
            if( refineryFull ) {
                return next();
            }

            if( results.yield > requiredYield ) {
                refineryCollection.selected.poplarPrice = parseFloat((refineryGatePrice+0.01).toFixed(2));
                parcelController.collection.mwa = refineryCollection.selected.poplarPrice;
                results.capacityReachedAt = i;
                refineryFull = true;
                return next();
            }

            results.count++;
            results.acres += props.usableSize;
            results.yield += props.yield;

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
            onComplete(results, refineryCollection, callback);
        }
    );
}

function setAdoptionPrecentile(parcel) {
    var diff = parcel.properties.ucd.refineryGateCost - parcelController.collection.refineryGatePrice.min;
    if( diff === 0 ) diff = 0.001;

    parcel.properties.ucd.adoptionPricePercentile = diff / (parcelController.collection.refineryGatePrice.max - parcelController.collection.refineryGatePrice.min);
    //parcel.properties.ucd.adoptionPricePercentile = 1 - (diff / (maxPrice - minPrice));
    var t = parcel.properties.ucd.adoptionPricePercentile.toFixed(2);
    parcel.properties.ucd.adoptionPricePercentile = parseFloat(t);

    if( debug[t] ) debug[t] += 1;
    else debug[t] = 1;
}

function onComplete(results, refineryCollection, callback) {
    // price not found
    if( results.capacityReachedAt === -1 ) {
        refineryCollection.selected.poplarPrice = refineryCollection.selected.maxWillingToPay;
        parcelController.collection.mwa = -1;
        results.capacityReachedAt = 0;
    }

    postProcess(refineryCollection, callback);
}

function postProcess(refineryCollection, callback) {
    var count = 0;
    var total = parcelController.collection.validIds.length;

    async.eachSeries(
        parcelController.collection.validIds,
        (id, next) => {
            count++;
            events.emit('optimize-update', (0.5 + (0.5 * (count / total))));


            parcelController.collection.get(id, (parcel) => {
                growthProfilesCollection.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {
                    growthProfile = JSON.parse(growthProfile.data);

                    // add transportation cost
                    transportationModel.sumCost(parcel);

                    parcel.properties.ucd.income.poplar = incomeCalculator.poplar(refineryCollection.selected.poplarPrice, parcel, growthProfile);

                    setAdoptionPrecentile(parcel);

                    parcelController.collection.update(parcel, () => {
                        next();
                    });
                });
            });
        },
        () => {
            console.log(debug);
            events.emit('optimize-end');
            callback(results);
        }
    );
}

function prepare(refineryCollection, callback) {
    var sortList = [];
    var minRGatePrice = 9999;
    var maxRGatePrice = 0;

    var minAdoptionPrice = 9999;
    var maxAdoptionPrice = 0;

    var count = 0;
    var total = parcelController.collection.validIds.length;

    async.eachSeries(
        parcelController.collection.validIds,
        (id, next) => {
            count++;
            events.emit('optimize-update', (0.5 * (count / total)));

            parcelController.collection.get(id, (parcel) => {
                growthProfilesCollection.get(parcel.properties.ucd.modelProfileId, (growthProfile) => {
                    parcel.properties.ucd.selected = 0;

                    growthProfile = JSON.parse(growthProfile.data);

                    parcelController.setFarmCost(parcel, growthProfile);
            
                    parcel.properties.ucd.income = {
                        crops : incomeCalculator.crops(parcel)
                    }

                    parcel.properties.ucd.adoptionPrice = calcAdoptionPrice(parcel, growthProfile);

                    var transportationCost = 0;
                    for( var j = 0; j < parcel.properties.ucd.farmCost.poplar.yearlyData.length; j++ ) {
                        transportationCost += parcel.properties.ucd.farmCost.poplar.yearlyData[j].transportation;
                    }
                    parcel.properties.ucd.transportationCost = transportationCost / growthProfile.data.totalPerAcre;
                    parcel.properties.ucd.refineryGateCost = parcel.properties.ucd.adoptionPrice + parcel.properties.ucd.transportationCost;
                    
                    if( parcel.properties.ucd.refineryGateCost < refineryCollection.selected.maxWillingToPay ) {
                        if( parcel.properties.ucd.adoptionPrice < minAdoptionPrice ) {
                            minAdoptionPrice = parcel.properties.ucd.adoptionPrice;
                        }
                        if( parcel.properties.ucd.adoptionPrice > maxAdoptionPrice ) {
                            maxAdoptionPrice = parcel.properties.ucd.adoptionPrice;
                        }

                        if( parcel.properties.ucd.refineryGateCost < minRGatePrice ) {
                            minRGatePrice = parcel.properties.ucd.refineryGateCost;
                        }
                        if( parcel.properties.ucd.refineryGateCost > maxRGatePrice ) {
                            maxRGatePrice = parcel.properties.ucd.refineryGateCost;
                        }

                        sortList.push({
                            id : parcel.properties.id,
                            usableSize : parcel.properties.usableSize,
                            yield : growthProfile.data.totalPerAcre * parcel.properties.usableSize,
                            adoptionPrice : parcel.properties.ucd.adoptionPrice,
                            refineryGatePrice : parcel.properties.ucd.refineryGateCost
                        });
                    } else {
                        parcel.properties.ucd.aboveRefineryWillingToPay = true;
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

            console.log({
                adoptionPrice : {
                    min : minAdoptionPrice,
                    max : maxAdoptionPrice
                },
                refineryGatePrice : {
                    min : minRGatePrice,
                    max : maxRGatePrice
                }
            })

            callback({
                sortList: sortList,
                adoptionPrice : {
                    min : minAdoptionPrice,
                    max : maxAdoptionPrice
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

function calcAdoptionPriceBeatsIncumbent(parcel, cropNet, growthProfile) {
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = growthProfile.data.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}