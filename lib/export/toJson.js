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
        parcels : datastore.validParcels.map(transform)
    };
    
    function transform(parcel) {
        var props = parcel.properties;
        var crop = props.ucd.cropInfo;
        
        var info = {
            id : props.PolyID,
            centroid : props.ucd.center,
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
                    value : crop.priceYield[0].price.price,
                    units : crop.priceYield[0].price.unit
                },
                yield : {
                    value : crop.priceYield[0].yield.yield,
                    units : crop.priceYield[0].yield.unit
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
                        value : props.ucd.transportation.properties.distance,
                        units : props.ucd.transportation.properties.distanceUnit
                    },
                    time : {
                        value : props.ucd.transportation.properties.time,
                        units : props.ucd.transportation.properties.timeUnit
                    },
                    cost : {
                        value : datastore.getTransportationCost(parcel),
                        units : '$ / Mg'
                    }
                }
            },
            revenue : {
                crop : props.ucd.revenueResults.cropsRevenue,
                poplar : props.ucd.revenueResults.poplarRevenue,
                poplarAverage : props.ucd.revenueResults.poplarRevenueAverage
            }
        }
        
        return info;
    }
    
    return resp;
}



module.exports = toJson;