var extend = require('extend');

/**
 crops should be 2 dim array [][].
 first is yearly cycle, second in crops within that year.
 Rotation will repeat until done.

 data should contain:
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

  items.forEach(function(item){
    var itemResults = [];

    var rotationCounter = 0, i, totalRevenue = 0;
    for( i = 0; i < years; i++ ) {
      totalRevenue += addYearData(itemResults, item[rotationCounter]);

      rotationCounter++;
      if( rotationCounter === item.length ) {
        rotationCounter = 0;
      }
    }

    results.push(itemResults);
    totals.push(totalRevenue);
  });

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

  yearRotation.forEach(function(data){
    var d = extend(true, {}, data);
    yearData.revenue += (d.price * d.yield) - d.cost;

    // this will be factored in per harvest, not per acre
    // and that's what the units are above
    if( d.transportation ) {
      yearData.transportation += d.transportation;
    }

    yearData.breakdown.push(d);
  });

  results.push(yearData);
  return yearData.revenue;
}

module.exports = calc;
