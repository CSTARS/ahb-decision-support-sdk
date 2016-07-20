var extend = require('extend');

/**
 crops should be 2 dim array [][].
 first is yearly cycle, second in crops within that year.
 Rotation will repeat until done.

 data should contain:
  - crop
  - cost // price to grow
  - transportation (optional) // price to transport
 everything should be per acre
**/
function calc(years, poplar, crops) {
  var yearlyResults = [];
  var totals = [];
  var poplarAvgPerYear = [];
  var items = [poplar];
  var totalTransportationCost = 0;

  if( crops ) {
    items.push(crops);
  }

  for( var i = 0; i < items.length; i++ ) {
    var item = items[i];
    var yearlyCostBreakdown = [];
    var rotationCounter = 0, j, totalFarmGateCost = 0, yd;
    
    
    for( j = 0; j < years; j++ ) {
      yd = getYearData(yearlyCostBreakdown, item[rotationCounter]);
      totalFarmGateCost += yd.water + yd.land + yd.crop; // per acre
      
      if( i === 0 ) { // 0 item is poplar

        totalTransportationCost += yd.transportation;
      }
      
      rotationCounter++;
      if( rotationCounter === item.length ) {
        rotationCounter = 0;
      }
    }

    yearlyResults.push(yearlyCostBreakdown);
    totals.push(totalFarmGateCost);
  }
  
  var resp = {
    units : '1/acre',
    poplar : {
      yearlyData : yearlyResults[0],
      totalFarmGateCost : totals[0],
      totalTransportationCost : totalTransportationCost,
      avgTransportationCostPerYear : totalTransportationCost / years
    }
  };
  
  if( crops ) {
    resp.crops = {
      yearlyData : yearlyResults[1],
      totalFarmGateCost : totals[1]
    }
  }

  return resp;
}

function getYearData(results, yearRotation) {
  // all cost per acre
  var yearData = {
    crop : 0,
    transportation : 0,
    water : 0,
    land : 0
  };

  var d;
  for( var i = 0; i < yearRotation.length; i++ ) {
    d = yearRotation[i];

    if( d.transportation ) {
      yearData.transportation += d.transportation;
    }
    
    if( d.water ) {
      yearData.water += d.water;
    }
    
    if( d.land ) {
      yearData.land += d.land;
    }
    
    yearData.crop += d.crop;
  }

  results.push(yearData);
  return yearData;
}

module.exports = calc;