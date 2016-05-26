function crops(parcel, datastore) {
    var data = [];
    var ucd = parcel.properties.ucd;
    var i, priceYield, income, yearIncome;
    var total = 0;
    
    for( var j = 0; j < datastore.poplarModel.years; j++ ) {
        yearIncome = 0;
        for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
            priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);
            income = priceYield.price.price * priceYield.yield.yield;

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

function poplar(price, parcel, datastore) {
    var data = [];
    var ucd = parcel.properties.ucd;
    var i, priceYield, income;
    var total = 0;
    
    for( var i = 0; i < ucd.harvest.harvests.length; i++ ) {
        income = price * ucd.harvest.harvests[i];
        data.push(0);
        if( i > 0 ) {
            data.push(0);
        }
        data.push(income);
        total += income;
    }
    
    return {
        total : total,
        yearly : data
    }
}

module.exports = {
    crops : crops,
    poplar : poplar
}