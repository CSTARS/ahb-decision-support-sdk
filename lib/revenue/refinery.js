function poplarCost(datastore, totalYield, poplarPrice, years) {
    if( !years ) {
        years = 1;
    }
    
    var r = datastore.selectedRefinery;
    
    return totalYield * poplarPrice * years;
}

function requiredCost(datastore, totalYield, poplarPrice, years) {
    if( !years ) {
        years = 1;
    }
    
    var r = datastore.selectedRefinery;
    
    var totalCost = r.capitalCost + (r.operatingCost.value * years);
    totalCost += poplarCost(datastore, totalYield, poplarPrice, years);
    
    return totalCost + (totalCost * datastore.ROI);
}

function income(datastore, years) {
    if( !years ) {
        years = 1;
    }
    
    var totalYield = datastore.selectedRefinery.feedstockCapacity.value;
    var refineryConversion = datastore.selectedRefinery.yield.value;
    var refineryProductPrice = datastore.selectedRefinery.product.price;

    return totalYield * refineryConversion * refineryProductPrice * years;
}

function transportationCost(parcel, datastore) {
    var costs = parcel.properties.ucd.farmCost;
    for( var j = 0; j < costs.poplar.yearlyData.length; j++ ) {
        datastore.totalTransportationCost += parcel.properties.usableSize * costs.poplar.yearlyData[j].transportation || 0;
    }
}

module.exports = {
    poplarCost : poplarCost,
    requiredCost : requiredCost,
    transportationCost : transportationCost,
    income : income
};