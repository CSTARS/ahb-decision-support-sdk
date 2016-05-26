var revenue = require('../revenue');

function toJson(poplarCost, datastore) {
    
    var totals = datastore.totals;
    
    var resp = {
        poplarCost : {
            value : poplarCost,
            units : 'Mg / Acre'
        },
        refinery : datastore.selectedRefinery,
        setup : {
            latitude : datastore.lat,
            longitude : datastore.lng,
            radius : datastore.radius,
            years : totals.years
        },
        results : {
            totalAcres : totals.acres,
            poplarPrice : datastore.poplarPrice,
            parcels : {
                selected : datastore.selectedParcels.length,
                competing : datastore.validParcels.length,
                all : datastore.allParcels.length
            },
            harvested : {
                value : totals.harvested,
                averagePerYear : totals.avgYearHarvest,
                units : 'Mg / Acre'
            },
            refinery : {
                maxWillingnessToPay : datastore.mwp,
                income : revenue.refinery.income(datastore, totals.harvested),
                poplarCost : revenue.refinery.poplarCost(datastore, totals.harvested, datastore.poplarPrice),
                operatingCost : datastore.selectedRefinery.operatingCost.value * totals.years
            }
        },
        parcels : {
            type : 'FeatureCollection',
            features : datastore.validParcels.map(transform)
        }
    };
    
    function transform(parcel) {
        var props = parcel.properties;
        var crop = props.ucd.cropInfo;
        var priceYield = datastore.getPriceAndYield(crop.swap[0]);
        
        var info = {
            id : props.PolyID,
            state : props.ucd.state,
            address : props.SiteAddressFull,
            adopted : datastore.selectedParcels.indexOf(parcel) > -1 ? true : false,
            size : {
                value : props.GISAcres,
                available : props.GISAcres * props.PotentiallySuitPctOfParcel,
                units : 'acre'
            },
            crop : {
                name : crop.swap[0],
                cost : {
                    value : crop.cropBudgets[0].total,
                    units : '$ / acre'
                },
                price : {
                    value : priceYield.price.price,
                    units : priceYield.price.unit
                },
                yield : {
                    value : priceYield.yield.yield,
                    units : priceYield.yield.unit
                }
            },
            poplar : {
                yield : {
                    value : props.ucd.harvest.totalHarvest,
                    perHarvest : props.ucd.harvest.harvests,
                    units : 'Mg / Acre'
                },
                transportation : {
                    distance : {
                        value : props.ucd.transportation.distance,
                        units : props.ucd.transportation.distanceUnit
                    },
                    duration : {
                        value : props.ucd.transportation.duration,
                        units : props.ucd.transportation.durationUnit
                    },
                    cost : {
                        value : datastore.getTransportationCost(parcel),
                        units : '$ / Mg'
                    }
                }
            },
            farmCost : {
                poplar : {
                    total : props.ucd.farmCost.poplar.total,
                    yearlyTotal : props.ucd.farmCost.poplar.yearlyTotal
                },
                crops : {
                    total : props.ucd.farmCost.crops.total,
                    yearlyTotal : props.ucd.farmCost.crops.yearlyTotal
                }
            },
            income : {
                poplar : {
                    total : props.ucd.income.poplar.total
                },
                crops : {
                    total : props.ucd.income.crops.total
                }
            }
        }
        
        return {
            type : 'Feature',
            geometry : {
                type : 'Point',
                coordinates : props.ucd.center
            },
            properties : info
        }
    }
    
    return resp;
}



module.exports = toJson;