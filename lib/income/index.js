module.exports = function(datastore, price, parcel) {
    var results = {};
    crops(results, parcel.properties.ucd, datastore);
    poplar(results, price, parcel.properties.ucd, datastore);
}

function crops(results, ucd, datastore) {
    var data = [];
    
    var i, priceYield, income;
    var total = 0;
    
    for( var i = 0; i < ucd.cropInfo.swap.length; i++ ) {
        priceYield = datastore.getPriceAndYield(ucd.cropInfo.swap[i]);
        
        income = priceYield.price.price * priceYield.yield.yield;
        data.push(income);
        total += income;
    }
    
    results.crops = {
        total : total,
        yearly : data
    }
}

function poplar(results, price, ucd, datastore) {
    var data = [];
    
    var i, priceYield, income;
    var total = 0;
    
    for( var i = 0; i < ucd.harvest.harvests.length; i++ ) {
        income = price * ucd.harvest.harvest[i];
        data.push(0);
        if( i > 0 ) {
            data.push(0);
        }
        data.push(income);
        total += income;
    }
    
    results.poplar = {
        total : total,
        yearly : data
    }
}