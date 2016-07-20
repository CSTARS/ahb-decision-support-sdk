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
}

function setCropCycle(ucd) {
    var cropCycle = [[]], budget, priceYield, crop, i;
    
    for( i = 0; i < ucd.cropInfo.swap.length; i++ ) {

        priceYield = cropsCollection.getCropPriceAndYield(ucd.cropInfo.swap[i], ucd.cropInfo.fips);
        budget = budgetsCollection.get(ucd.budgetIds[i]);

        crop = {
            yield : priceYield.yield[ucd.cropInfo.pasture ? 'non-irrigated' : 'irrigated'],
            yieldUnits : priceYield.yield.unit,
            name : ucd.cropInfo.swap[i],
            crop : budget.error ? 9999 : budget.budget.total
        };

        cropCycle[0].push(crop);
    }
    
    return cropCycle;
}

// everything here should be in per acre per year
function createPoplarCycle(parcel, growthProfile) {
    var landCost = landController.getCost(parcel);
    var waterCost = waterController.getIrrigationCost(parcel, growthProfile);
    
    var poplarCycle = [];
    for( var i = 0; i < growthProfile.data.harvests.length; i++ ) {
        var y = growthProfile.data.harvests[i];

        if( isNaN(y) ) {
            return; 
        }

        var poplarHarvestCost = {
            crop : budgetsCollection.poplarTotal,
            name : 'poplar',
            transportation : transportationModel.getCostPerAcre(parcel, y),
            water : waterCost,
            land : landCost
        };
        var poplarOffyearCost = {
            crop : budgetsCollection.poplarTotal,
            water : waterCost,
            land : landCost,
            name : 'poplar',
            transportation : 0
        };
        
        poplarCycle.push([poplarOffyearCost]);
        if( i > 0 ) {
            poplarCycle.push([poplarOffyearCost]);
        }
        poplarCycle.push([poplarHarvestCost]);
    };
    
    return poplarCycle;
}


module.exports = prepare;