var calc = require('./calc');

var cropsCollection = require('../../../collections/crops');
var budgetsCollection = require('../../../collections/budgets');
var waterController = require('../../../controllers/water');
var landController = require('../../../controllers/land');
var transportationModel = require('../../../models/transportation');

function prepare(parcel, growthProfile) {
    if( !growthProfile ) return;

    var ucd = parcel.properties.ucd;

    var poplarCycle = createPoplarCycle(parcel, growthProfile);
    var cropCycle = setCropCycle(ucd);
    
    ucd.farmCost = calc(growthProfile.data.years, poplarCycle, cropCycle);

    // TODO: maybe we could add this back in?  Memory shouldn't be issue now...
    //ucd.farmCost.poplar.cycle = poplarCycle;
    //ucd.farmCost.crops.cycle = cropCycle;
}

function setCropCycle(ucd) {
    var cropCycle = [[]], budget, priceYield, crop, i;
    
    for( i = 0; i < ucd.cropInfo.swap.length; i++ ) {

        priceYield = cropsCollection.getCropPriceAndYield(ucd.cropInfo.swap[i], ucd.cropInfo.fips);
        budget = budgetsCollection.get(ucd.budgetIds[i]);

        crop = {
            yield : priceYield.yield[ucd.cropInfo.pasture ? 'non-irrigated' : 'irrigated'],
            yieldUnits : priceYield.yield.unit,
            crop : ucd.cropInfo.swap[i],
            cost : budget.error ? 9999 : budget.budget.total
        };

        cropCycle[0].push(crop);
    }
    
    return cropCycle;
}

function createPoplarCycle(parcel, growthProfile) {
    var ucd = parcel.properties.ucd;
    var years = growthProfile.data.years;
    var transportationCost = transportationModel.getCost(parcel); // per ton
    var waterCost = waterController.getCost(parcel) * 0.3048; 
    var landCost = landController.getCost(parcel);
    var irrigation = growthProfile.totalIrrigation / years;
    
    var poplarCycle = [];
    for( var i = 0; i < growthProfile.data.harvests.length; i++ ) {
        var y = growthProfile.data.harvests[i];

        if( isNaN(y) ) {
            return; 
        }

        var poplarHarvest = {
            cost : budgetsCollection.poplarTotal,
            crop : 'poplar',
            transportation : transportationCost,
            water : waterCost * irrigation * 3.4,
            land : landCost,
            yield : y
        };
        var poplarOffyear = {
            cost : budgetsCollection.poplarTotal,
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