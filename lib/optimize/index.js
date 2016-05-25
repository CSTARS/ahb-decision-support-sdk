var setCost = require('../cost').parcel;

module.exports = function(datastore, farmBudgetSdk, poplarModel) {
  return function(options, callback) {
      
    var minPrice = options.minPrice;
    var maxPrice = options.maxPrice;
    var step = options.step;
    
    if( !step ) {
      step = 0.2;
    }
    

    var years = datastore.poplarModel.monthsToRun / 12;
    var requiredYield = datastore.selectedRefinery.feedstockCapacity.value * years;
    var minPoplarPrice = null;
    var maxWillingToPay = 0;
    var results = [];

    var prices = [];
    for( var price = minPrice; price <= maxPrice; price += step ) {
      prices.push(parseFloat(price.toFixed(2)));
    }
    if( minPrice <= maxPrice ) {
      prices.push(parseFloat(maxPrice.toFixed(2)));
    }
    
    // make sure we set correct cost for all parcels
    datastore.validParcels.forEach(function(parcel){
       setCost(parcel, datastore); 
    });

    async.eachSeries(
      prices,
      function(price, next) {
        if( options.prescan && minPoplarPrice ) {
          return next();
        }

        var result = {
          price : price,
          poplar : {
            yield : 0,
            parcels : 0,
            acres : 0,
          },
          tmp : []
        };
        var sortList = [];
          
        for( var z = 0; z < datastore.validParcels.length; z++) {
            
        }
          
      },
      function(err){
        if( err ) {
          debugger;
        }
        
        callback({
          results : results,
          minPoplarPrice : minPoplarPrice,
          maxPoplarPrice : maxWillingToPay,
          poplarPrice : minPoplarPrice
          //poplarPrice : minPoplarPrice + ((maxWillingToPay - minPoplarPrice) / 2)
        });
      }
    );
    
  }
}