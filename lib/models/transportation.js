var collection = require('../collections/transportation');
var events = require('../events');

var KM_TO_MILES = 0.621371;

function TransportationModel() {


  this.collection = collection;

  /*  
      Returns: $/Mg

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

    var tonsPerTruck = collection.getTonsPerTruck(collection.TRUCK_MATERIAL);
    var miles = transportation.distance * KM_TO_MILES;
    var hours = transportation.duration;

    /*
      2* cause you have to drive back
      1.67 cause you  need that many drivers (sometimes 1 mostly 2)
      1/6 cause you get 6 MPG
      0.29 must be oil, etc.
    */
    var labor = collection.DRIVERS_PER_TRUCK * collection.TRUCK_LABOR * hours;
    var fuel = (1/collection.MILES_PER_GALLON) * collection.FUEL_COST * miles;
    var cost = collection.OIL_ETC_COST + fuel + labor;
    cost = cost / tonsPerTruck;
    return cost * 2;
  };

  this.getCostPerAcre = function(parcel, poplarYield) {
    var costPerTon = this.getCost(parcel); // $ / Mg
    return costPerTon * collection.DRY_TON_TO_WET_TON * poplarYield + this.getLoadingUnloadingCost();
  }

  this.getLoadingUnloadingCost = function() {
    // loading:=0.22*1.67*LCtd;
    // unloading:=0.16667*(44.31 + 1.6*LCbh) + loading;
    // then divide by tons per TRUCK
    // loading:=loading/tons_per_truck;
    // unloading:=unloading/tons_per_truck;
    var loading = 0.22 * 1.67 + collection.TRUCK_LABOR;
    var unloading = 0.16667 * (44.31 + 1.6 * collection.TRUCK_LABOR) + loading;
    var tonsPerTruck = collection.getTonsPerTruck(collection.TRUCK_MATERIAL);
    loading = loading / tonsPerTruck;
    unloading = unloading / tonsPerTruck;

    return loading + unloading;
  }

  this.clearCost = function() {
    collection.totalCost = 0;
  }

  // add the parcel transportation cost to the total transportation cost
  this.sumCost = function(parcel) {
      var costs = parcel.properties.ucd.farmCost;
      for( var j = 0; j < costs.poplar.yearlyData.length; j++ ) {
          collection.totalCost += parcel.properties.usableSize * (costs.poplar.yearlyData[j].transportation || 0);
      }
  }

  events.on('get-transportation-loading-unloading-cost', (e) => {
    e.handler(this.getLoadingUnloadingCost());
  });

}




module.exports = new TransportationModel();