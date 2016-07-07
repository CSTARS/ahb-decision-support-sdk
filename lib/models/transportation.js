var collection = require('../collections/transportation');

var KM_TO_MILES = 0.621371;

function TransportationModel() {
  this.TRUCK_MATERIAL = 'bulk';
  this.FUEL_COST = 3.88; // $/us_gal;
  this.TRUCK_LABOR = 12.95; // $/h

  this.collection = collection;

  /*  
      Drived from the following SQL:

      tons_per_truck:=inl.tons_per_truck(material,county_fips);
      FCr := (inl.fuel_cost(county_fips,year)).on_road;
      LCtd := inl.labor_cost('truck',county_fips,year);
      IF (material = 'bale') THEN
        cost:=2*((0.29 + (1.0/6.0)*FCr)*miles + 1.67*LCtd*hours) / tons_per_truck;
  */
  this.getCost = function(feature) {
    var transportation = collection.get(feature.properties.id);

    if( transportation.error ) {
      return -1;
    }

    var tonsPerTruck = getTonsPerTruck(this.TRUCK_MATERIAL);
    var miles = transportation.distance * KM_TO_MILES;
    var hours = transportation.duration;

    /*
      2* cause you have to drive back
      1.67 cause you  need that many drivers (sometimes 1 mostly 2)
      1/6 cause you get 6 MPG
      0.29 must be oil, etc.
    */
    var cost = 2 * ((0.29 + (1.0/6.0)*this.FUEL_COST)*miles + 1.67*this.TRUCK_LABOR*hours) / tonsPerTruck;

    return cost;
  };

  this.clearCost = function() {
    collection.cost = 0;
  }

  // add the parcel transportation cost to the total transportation cost
  this.sumCost = function(parcel) {
      var costs = parcel.properties.ucd.farmCost;
      for( var j = 0; j < costs.poplar.yearlyData.length; j++ ) {
          collection.totalCost += parcel.properties.usableSize * costs.poplar.yearlyData[j].transportation || 0;
      }
  }

}

function getTonsPerTruck(material) {
  if (material === 'bale') return 17; // tons/truck  @ 26 *  0.65445 tons/bale
  if (material === 'bulk') return 19.9; // tons/truck @ 9.1 lb / ft 3
  return 18.5;
}


module.exports = new TransportationModel();