var extend = require('extend');

/**
 crops should be 2 dim array [][].
 first is yearly cycle, second in crops within that year.
 Rotation will repeat until done.

 data should contain:
  - crop
  - cost // price to grow
  - transportation (optional) // price to transport
  - yield
 everything should be per acre
**/
function calc(years, poplar, crops) {
  var results = [];
  var totals = [];
  var poplarAvgPerYear = [];
  var items = [poplar];
  
  if( crops ) {
    items.push(crops);
  }

  for( var i = 0; i < items.length; i++ ) {
    var item = items[i];
    var itemResults = [];
    var rotationCounter = 0, j, totalCost = 0;
    
    for( j = 0; j < years; j++ ) {
      totalCost += addYearData(itemResults, item[rotationCounter]);
      
      if( i === 0 ) {
        var cTotalCost = totalCost;
        poplarAvgPerYear.push(cTotalCost);
      }
      
      rotationCounter++;
      if( rotationCounter === item.length ) {
        rotationCounter = 0;
      }
    }

    results.push(itemResults);
    totals.push(totalRevenue);
  }
  
  var avg = 0;
  for( var i = 0; i < poplarAvgPerYear.length; i++ ) { 
    avg += poplarAvgPerYear[i];
  };
  
  var resp = {
    poplar : {
      yearlyData : results[0],
      yearlyTotal : totals[0],
      average : avg / years
    }
  };
  
  if( crops ) {
    resp.crops = {
      yearlyData : results[1],
      yearlyTotal : totals[1]
    }
  }

  return resp;
}

function addYearData(results, yearRotation) {
  var yearData = {
    cost : 0,
    transportation : 0,
    water : 0,
    land : 0,
    breakdown : []
  };


  var d;
  for( var i = 0; i < yearRotation.length; i++ ) {
    d = yearRotation[i];

    //var d = extend(true, {}, data);
    //          $/Mg      Mg/Acre    $/Acre
    var cost = d.cost; // per acre

    if( d.transportation ) {
      var transportationCost = d.transportation * d.yield;
      yearData.transportation += transportationCost;
      
      // TODO: move this to refinery side... somehow
      //revenue -= transportationCost;
    }
    
    if( d.water ) {
      yearData.water += d.water;
      cost += d.water;
    }
    
    if( d.land ) {
      yearData.land += d.land;
      cost += d.land;
    }
    
    yearData.cost += cost;
    yearData.breakdown.push(d);
  }

  results.push(yearData);
  return yearData.cost;
}

module.exports = calc;