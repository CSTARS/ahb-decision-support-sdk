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

function income(datastore, totalYield, years) {
    if( !years ) {
        years = 1;
    }
    var refineryConversion = datastore.selectedRefinery.yield.value;
    var refineryProductPrice = datastore.selectedRefinery.product.price;

    return totalYield * refineryConversion * refineryProductPrice * years;
}

module.exports = {
    poplarCost : poplarCost,
    requiredCost : requiredCost,
    income : income
};