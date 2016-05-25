var calc = require('./calc');

function setCost(parcels, datastore) {

    for( var z = 0; z < parcels.length; z++) {
        var parcel = parcels[z];
        if( !parcel.properties.ucd.harvest ) return;

        var ucd = parcel.properties.ucd;
        var years = ucd.harvest.years;
        var poplarCycle = [];

        var transportationCost = datastore.getTransportationCost(parcel); // per ton
        var waterCost = datastore.getWaterCost(parcel) * 0.3048; 
        var landCost = datastore.getLandCost(parcel);
        var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;
        var totalPoplarYield = 0;
        
        var mpi = parcel.properties.ucd.modelProfileId;
        var irrigation = poplarModel.profiles[mpi].totalIrrigation / years;

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


       // TODO: check units
       // we only need to calculate the crops once
       var cropCycle;
       ucd.cropInfo.cropCycle = [[]];
        for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
            var priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);

            var crop = {
                yield : priceYield.yield.yield,
                yieldUnits : priceYield.yield.unit,
                crop : ucd.cropInfo.swap[i],
                cost : ucd.cropInfo.cropBudgets[i].budget.total
            };

            ucd.cropInfo.cropCycle[0].push(crop);
        }
        
        ucd.farmCost = calc(years, poplarCycle, ucd.cropInfo.cropCycle);
    };

}