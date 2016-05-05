var extend = require('extend');

/**
 crops should be 2 dim array [][].
 first is yearly cycle, second in crops within that year.
 Rotation will repeat until done.

 data should contain:
  - size
  - crop
  - price
  - cost // price to grow
  - transportation (optional) // price to transport
  - yield
 everything should be per acre
**/
function calc(years, poplar, crops) {
  var results = [];
  var totals = [];
  var items = [poplar, crops];

  //items.forEach(function(item){
  for( var i = 0; i < items.length; i++ ) {
    var item = items[i];

    var itemResults = [];

    var rotationCounter = 0, j, totalRevenue = 0;
    for( j = 0; j < years; j++ ) {
      totalRevenue += addYearData(itemResults, item[rotationCounter]);

      rotationCounter++;
      if( rotationCounter === item.length ) {
        rotationCounter = 0;
      }
    }

    results.push(itemResults);
    totals.push(totalRevenue);
  //});
  }

  return {
    poplar : results[0],
    poplarRevenue : totals[0],
    crops : results[1],
    cropsRevenue : totals[1]
  };
}

function addYearData(results, yearRotation) {
  var yearData = {
    revenue : 0,
    transportation : 0,
    breakdown : []
  };

  //yearRotation.forEach(function(data) {
  //  var d = data;
  var d;
  for( var i = 0; i < yearRotation.length; i++ ) {
    d = yearRotation[i];

    //var d = extend(true, {}, data);
    var cost = (d.price * d.yield) - d.cost; // per acre
    cost = cost * d.size; // cost for farm

    if( d.transportation ) {
      var transportationCost = d.transportation * d.yield;
      yearData.transportation += transportationCost;
      yearData.revenue += cost - transportationCost;
    } else {
      yearData.revenue += cost;
    }

    yearData.breakdown.push(d);
  //});
}

  results.push(yearData);
  return yearData.revenue;
}

module.exports = calc;
