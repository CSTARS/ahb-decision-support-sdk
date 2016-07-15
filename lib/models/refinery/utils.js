function poplarCost(totalYield, poplarPrice, years) {
    if( !years ) {
        years = 1;
    }
    
    return totalYield * poplarPrice * years;
}

function requiredCost(refinery, totalYield, poplarPrice, years) {
    if( !years ) {
        years = 1;
    }
    
    var totalCost = refinery.capitalCost + (refinery.operatingCost.value * years);
    totalCost += poplarCost(totalYield, poplarPrice, years);
    
    return totalCost + (totalCost * refinery.ROI);
}

function income(totalYield, refinery, years) {
    if( !years ) {
        years = 1;
    }

    var refineryConversion = refinery.yield.value;
    var refineryProductPrice = refinery.product.price;

    return totalYield * refineryConversion * refineryProductPrice * years;
}

module.exports = {
    poplarCost : poplarCost,
    requiredCost : requiredCost,
    income : income
};