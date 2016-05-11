// capital recovery factor
function crf(roi, life) {
    return (roi * Math.pow(1+roi, life)) / (Math.pow(1+roi, life) - 1); 
}

// maximum willingness to pay 
function mwp(productPrice, productYield, crf, capitalCost, operatingCost, feedstock) {
    return (productPrice * productYield) - ((crf * capitalCost + operatingCost) / feedstock);
}

module.exports = {
    crf : crf,
    mwp : mwp
};