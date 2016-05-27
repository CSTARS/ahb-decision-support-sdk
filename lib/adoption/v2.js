var setCost = require('../cost').parcel;
var incomeCalculator = require('../income');

module.exports = function(datastore, farmBudgetSdk, poplarModel) {
  return function(options) {
      var sortList = [];
      var parcel, sortList;
      
      for( var i = 0; i < datastore.validParcels.length; i++ ) {
        parcel = datastore.validParcels[i];
        
        setCost(parcel, datastore); 
       
        parcel.properties.ucd.income = {
            crops : incomeCalculator.crops(parcel, datastore)
        }
          
        parcel.properties.ucd.adoptionPrice = calcAdoptionPrice(parcel);
        
        var transportationCost = 0;
        for( var j = 0; j < parcel.properties.ucd.farmCost.poplar.yearlyData.length; j++ ) {
          transportationCost += parcel.properties.ucd.farmCost.poplar.yearlyData[j].transportation;
        }
        parcel.properties.ucd.transportationCost = transportationCost / parcel.properties.ucd.harvest.totalPerAcre;
        parcel.properties.ucd.refineryGateCost = parcel.properties.ucd.adoptionPrice + parcel.properties.ucd.transportationCost;
        
        sortList.push(parcel);
      }
      
      sortList.sort((a, b) => {
         if( a.properties.ucd.refineryGateCost > b.properties.ucd.refineryGateCost ) {
             return 1;
         }
         if( a.properties.ucd.refineryGateCost < b.properties.ucd.refineryGateCost ) {
             return -1;
         }
         return 0;
      });
      
      var requiredYield = datastore.selectedRefinery.feedstockCapacity.value * poplarModel.years;
      
      var results = {
          parcels : sortList,
          count : 0,
          acres : 0,
          yield : 0,
          requiredYield : requiredYield,
          capacityReachedAt : -1
      }
      var props;
      datastore.selectedParcels = [];
      
      var poplarPrice = 0;
      
      for( var i = 0; i < sortList.length; i++ ) {
          props = sortList[i].properties;
          results.count++;
          results.acres += props.usableSize;
          results.yield += props.ucd.harvest.total;
          datastore.selectedParcels.push(sortList[i]);
          
          if( sortList[i].properties.ucd.adoptionPrice > poplarPrice ) {
              poplarPrice = sortList[i].properties.ucd.adoptionPrice;
          }
          
          if( results.yield > requiredYield ) {
              datastore.poplarPrice = parseFloat(poplarPrice.toFixed(2))+0.01;
              datastore.mwa = datastore.poplarPrice;
              results.capacityReachedAt = i;
              break;
          }
      }
      
      for( var i = 0; i < datastore.validParcels.length; i++ ) {
        parcel = datastore.validParcels[i];
        parcel.properties.ucd.income.poplar = incomeCalculator.poplar(datastore.poplarPrice, parcel, datastore);
      }

      return results;
  }
}

function log(m) {
    console.log(m);
}

function calcAdoptionPrice(parcel) {
    var ucd = parcel.properties.ucd;
    
    var cropNet = ucd.income.crops.total - ucd.farmCost.crops.total;
    if( cropNet < 0 ) {
        return calcAdoptionPriceAboveZero(parcel);
    } else {
        return calcAdoptionPriceBeatsIncumbent(parcel, cropNet);
    }
}

function calcAdoptionPriceAboveZero(parcel) {
    var cropNet = 0; // hummm;
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = parcel.properties.ucd.harvest.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}

function calcAdoptionPriceBeatsIncumbent(parcel, cropNet) {
    var poplarCost = parcel.properties.ucd.farmCost.poplar.total;
    var poplarYield = parcel.properties.ucd.harvest.totalPerAcre;
    
    var requirePrice = (cropNet + poplarCost) / poplarYield;
    
    return requirePrice;
}