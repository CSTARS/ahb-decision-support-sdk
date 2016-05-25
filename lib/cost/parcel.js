var calc = require('./calc');

function setCost(parcels, datastore) {
    for( var z = 0; z < parcels.length; z++) {
        prepare(parcels[z]);
    };
}

function prepare(parcel) {
    if( !parcel.properties.ucd.harvest ) return;

    var ucd = parcel.properties.ucd;

    var poplarCycle = createPoplarCycle(ucd, datastore);
    var cropCycle = setCropCycle(ucd, datastore);
    
    ucd.farmCost = calc(years, poplarCycle, cropCycle);
    ucd.farmCost.poplar.cycle = poplarCycle;
    ucd.farmCost.crop.cycle = cropCycle;
}

function setCropCycle(ucd, datastore) {
    var cropCycle = [[]];
    
    for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
        var priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);

        var crop = {
            yield : priceYield.yield.yield,
            yieldUnits : priceYield.yield.unit,
            crop : ucd.cropInfo.swap[i],
            cost : ucd.cropInfo.cropBudgets[i].budget.total
        };

        cropCycle[0].push(crop);
    }
    
    return cropCycle;
}

function createPoplarCycle(ucd, datastore) {
    var years = ucd.harvest.years;
    var transportationCost = datastore.getTransportationCost(parcel); // per ton
    var waterCost = datastore.getWaterCost(parcel) * 0.3048; 
    var landCost = datastore.getLandCost(parcel);
    var mpi = parcel.properties.ucd.modelProfileId;
    var irrigation = poplarModel.profiles[mpi].totalIrrigation / years;
    
    var poplarCycle = [];
    for( var i = 0; i < ucd.harvest.harvests.length; i++ ) {
        var y = ucd.harvest.harvests[i];
        if( isNaN(y) ) {
            return; 
        }
        
        totalPoplarYield += y;
        
        var poplarHarvest = {
            cost : farmBudgetSdk.getPoplarTotal(),
            crop : 'poplar',
            transportation : transportationCost,
            water : waterCost * irrigation * 3.4,
            land : landCost,
            yield : y
        };
        var poplarOffyear = {
            cost : farmBudgetSdk.getPoplarTotal(),
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


module.exports = setCost;