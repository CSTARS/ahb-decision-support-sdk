var calc = require('./calc');


function prepare(parcel, datastore) {
    if( !parcel.properties.ucd.harvest ) return;

    var ucd = parcel.properties.ucd;

    var poplarCycle = createPoplarCycle(parcel, datastore);
    var cropCycle = setCropCycle(ucd, datastore);
    
    ucd.farmCost = calc(ucd.harvest.years, poplarCycle, cropCycle);
    //ucd.farmCost.poplar.cycle = poplarCycle;
    //ucd.farmCost.crops.cycle = cropCycle;
}

function setCropCycle(ucd, datastore) {
    var cropCycle = [[]], budget;
    
    for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
        var priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);

        budget = ucd.cropInfo.cropBudgets[i]

        var crop = {
            yield : priceYield.yield.yield,
            yieldUnits : priceYield.yield.unit,
            crop : ucd.cropInfo.swap[i],
            cost : budget.error ? 9999 : budget.budget.total
        };

        cropCycle[0].push(crop);
    }
    
    return cropCycle;
}

function createPoplarCycle(parcel, datastore) {
    var ucd = parcel.properties.ucd;
    var years = ucd.harvest.years;
    var transportationCost = datastore.getTransportationCost(parcel); // per ton
    var waterCost = datastore.getWaterCost(parcel) * 0.3048; 
    var landCost = datastore.getLandCost(parcel);
    var mpi = parcel.properties.ucd.modelProfileId;
    var irrigation = datastore.poplarModel.profiles[mpi].totalIrrigation / years;
    
    var poplarCycle = [];
    for( var i = 0; i < ucd.harvest.harvests.length; i++ ) {
        var y = ucd.harvest.harvests[i];
        if( isNaN(y) ) {
            return; 
        }

        var poplarHarvest = {
            cost : datastore.getPoplarTotal(),
            crop : 'poplar',
            transportation : transportationCost,
            water : waterCost * irrigation * 3.4,
            land : landCost,
            yield : y
        };
        var poplarOffyear = {
            cost : datastore.getPoplarTotal(),
            water : waterCost * irrigation * 3.4,
            land : landCost,
            crop : 'poplar',
            transportation : 0,
            yield : 0
        };
        
        poplarCycle.push([poplarOffyear]);
        if( i > 0 ) {
            poplarCycle.push([poplarOffyear]);
        }
        poplarCycle.push([poplarHarvest]);
    };
    
    return poplarCycle;
}


module.exports = prepare;