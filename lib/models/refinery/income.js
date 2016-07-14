var growthProfilesCollection = require('../../collections/growthProfiles');
var cropsCollection = require('../../collections/crops');

function crops(parcel) {
    var data = [];
    var ucd = parcel.properties.ucd;
    var i, priceYield, income, yearIncome;
    var total = 0;
    
    for( var j = 0; j < growthProfilesCollection.years; j++ ) {
        yearIncome = 0;
        for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
            priceYield = cropsCollection.getCropPriceAndYield(ucd.cropInfo.swap[i],  ucd.cropInfo.fips);
            income = priceYield.price.price * priceYield.yield[ucd.cropInfo.pasture ? 'non-irrigated' : 'irrigated'];

            if( isNaN(income) ) {
                debugger;
            }

            total += income;
            yearIncome += income;
        }
        data.push(yearIncome);
    }
    
    return {
        total : total,
        yearly : data
    }
}

function poplar(price, parcel, growthProfile) {
    var yearly = [];
    var ucd = parcel.properties.ucd;
    var i, priceYield, income;
    var total = 0;
    
    for( var i = 0; i < growthProfile.data.harvests.length; i++ ) {
        income = price * growthProfile.data.harvests[i];
        
        // TODO: this is creating a 2,3,3,3,3 harvest cycle.  It should
        // be configure able
        yearly.push(0);
        if( i > 0 ) {
            yearly.push(0);
        }

        yearly.push(income);
        total += income;
    }
    
    return {
        total : total,
        yearly : yearly
    }
}

module.exports = {
    crops : crops,
    poplar : poplar
}