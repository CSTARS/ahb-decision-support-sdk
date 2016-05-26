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

function transportationCost(datastore) {
    var i, j, costs, parcel;
    var transportation = 0;
    
    for( i = 0; i < datastore.selectedParcels.length; i++ ) {
        parcel = datastore.selectedParcels[i];
        costs = parcel.properties.ucd.farmCost;
        for( j = 0; j < costs.poplar.yearlyData.length; j++ ) {
            transportation += parcel.properties.usableSize * costs.poplar.yearlyData[j].transportation || 0;
        }
    }
    
    return transportation;
}

module.exports = {
    poplarCost : poplarCost,
    requiredCost : requiredCost,
    transportationCost : transportationCost,
    income : income
};