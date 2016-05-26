var async = require('async');
var setCost = require('../cost').parcel;
var incomeCalculator = require('../income');

module.exports = function(datastore, farmBudgetSdk, poplarModel) {
  return function(options, callback) {

    var years = datastore.poplarModel.years;
    var args = {
        years : years,
        requiredYield : datastore.selectedRefinery.feedstockCapacity.value * years,
        minPoplarPrice : null,
        maxWillingToPay : 0
    }
    
    var results = [], result;
    var prices = createPricesArray(options);
    
    // make sure we set correct cost for all parcels
    datastore.validParcels.forEach(function(parcel){
       setCost(parcel, datastore); 
       
       parcel.properties.ucd.income = {
         crops : incomeCalculator.crops(parcel, datastore)
       }
    });

    async.eachSeries(
      prices,
      function(price, next) {
        if( options.prescan && args.minPoplarPrice ) {
          return next();
        }
        
        args.price = price;
        result = calculateRevenue(args, datastore);
        
        setAdoptionBreakdown(result);
        
        
        if( (args.minPoplarPrice === null && (result.adopted.yield > args.requiredYield || price === options.maxPrice)) || options.setPrice === true  ) {
          args.minPoplarPrice = price;
          

          if( options.setPoplarPrice ) {
            datastore.mwa = price;
            datastore.mwp = parseFloat(args.maxWillingToPay.toFixed(2));
            // no idea... split the difference?
            // market forces go herez
            datastore.poplarPrice = price;
            
            datastore.selectedParcels = [];
            result.data.forEach(function(item){
              item.parcel.properties.ucd.income.poplar = item.poplarIncome;
              
              if( !item.adopted ) {
                return;
              } 
              datastore.selectedParcels.push(item.parcel);
            });
          }
        }
        
        results.push(result);
        
        next();
      },
      function(err){
        callback({
          results : results,
          minPoplarPrice : args.minPoplarPrice,
          maxPoplarPrice : args.maxWillingToPay, // TODO
          poplarPrice : args.minPoplarPrice
        });
      }
    );
    
  }
}

function setAdoptionBreakdown(result) {
  var item;
  for( var i = 0; i < result.data.length; i++ ) {
    item = result.data[i];
    
    if( !result.crops[item.incumbentCrops] ) {
      result.crops[item.incumbentCrops] = {
        parcels : 0,
        acres : 0
      }
    }
    
    if( !item.adopted ) {
      result.crops[item.incumbentCrops].parcels++;
      result.crops[item.incumbentCrops].acres += item.parcel.properties.usableSize;
    }
  }
}


function calculateRevenue(args, datastore) {
    var result = {
      price : args.price,
      adopted : {
        yield : 0,
        parcels : 0,
        acres : 0,
      },
      crops : {},
      data : []
    };

    var poplarIncome, cropNet, poplarNet, parcel, ucd, data, transportation, j;

    for( var i = 0; i < datastore.validParcels.length; i++) {
        parcel = datastore.validParcels[i];
        ucd = parcel.properties.ucd;
        
        poplarIncome = incomeCalculator.poplar(args.price, parcel, datastore);
        
        cropNet = ucd.income.crops.total - ucd.farmCost.crops.total;
        poplarNet = poplarIncome.total - ucd.farmCost.poplar.total;
        
        transportation = 0;
        for( j = 0; j < ucd.farmCost.poplar.yearlyData.length; j++ ) {
          transportation += ucd.farmCost.poplar.yearlyData[j].transportation;
        }
        
        data = {
          incumbentCrops : ucd.cropInfo.swap.join(','),
          parcel : parcel,
          poplarIncome : poplarIncome,
          cropNet : cropNet,
          poplarNet : poplarNet,
          netDifference : poplarNet - cropNet,
          averagePoplarNet : calcAveragePoplarNet(poplarIncome.yearly, ucd.farmCost.poplar.yearlyData),
          adopted : false
        };
        
        result.data.push(data);
        
        if( data.netDifference - transportation > 0 && data.averagePoplarNet > 0 ) {
          data.adopted = true;
          result.adopted.yield += ucd.harvest.total;
          result.adopted.parcels++;
          result.adopted.acres += parcel.properties.usableSize;
        }
    }
    
    return result;
}

function calcAveragePoplarNet(incomes, costs) {
  var total = 0;
  for( var i = 0; i < incomes.length; i++ ) {
    total += incomes[i] - costs[i].cost;
  }
  return total / incomes.length;
}

function createPricesArray(options) {
    if( options.setPrice ) {
      return [options.minPrice];
    }
  
    var minPrice = options.minPrice;
    var maxPrice = options.maxPrice;
    var step = options.step;
    
    if( !step ) {
      step = 0.2;
    }
    
    var prices = [];
    for( var price = minPrice; price <= maxPrice; price += step ) {
      prices.push(parseFloat(price.toFixed(2)));
    }
    if( minPrice <= maxPrice ) {
      prices.push(parseFloat(maxPrice.toFixed(2)));
    }
    
    return prices;
}