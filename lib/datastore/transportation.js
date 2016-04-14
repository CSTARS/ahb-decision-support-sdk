
// TODO: move to per county?
var FUEL_COST = 3.88; // $/us_gal;
var TRUCK_LABOR = 12.95; // $/h
var KM_TO_MILES = 0.621371;

module.exports = function(DataStore) {

  DataStore.prototype.getTransportation = function(socketId, callback) {
    if( typeof socketId === 'function' ) {
      callback = socketId;
      socketId = undefined;
    }

    this.events.emit('transportation-update-start');
    var stop = [this.lat, this.lng];

    var startingPoints = [];
    this.validParcels.forEach(function(parcel){
      var start = parcel.properties.ucd.center;
      start = [start[1], start[0]];
      startingPoints.push(start);
    }.bind(this));

    this.rest.transportation.getAll(startingPoints, stop, socketId, function(err, resp){
      if( err ) {
        if( callback ) callback(err);
        return;
      }
      resp = resp.body;

      if( resp.error ) {
        return console.log(resp.message);
      }

      this.network = {};
      resp.network.features.forEach(function(feature){
        this.network[feature.properties.id] = feature;
      }.bind(this));

      this.networkUse = resp.use;
      this.maxNetworkUse = 1;
      for( var key in this.networkUse ) {
        if( this.networkUse[key] > this.maxNetworkUse ) {
          this.maxNetworkUse = this.networkUse[key];
        }
      }

      for( var i = 0; i < resp.paths.features.length; i++ ) {
        this.validParcels[i].properties.ucd.transportation = resp.paths.features[i];
      }

      if( callback ) callback();
      this.events.emit('transportation-update-end');
    }.bind(this));
  };

  DataStore.prototype.getNetworkPath = function(feature) {
    var collections = {
      type : 'FeatureCollection',
      features : []
    };

    feature.properties.path.forEach(function(id){
      collection.features.push(this.network[id]);
    }.bind(this));

    return collection;
  };

  DataStore.prototype.getTransportationCost = function(feature) {
    var transportation = feature.properties.ucd.transportation;

    if( transportation.properties.error ) {
      return -1;
    }

    var tonsPerTruck = getTonsPerTruck('bulk');
    var miles = transportation.properties.distance * KM_TO_MILES;
    var hours = transportation.properties.time;

    /*
      2* cause you have to drive back
      1.67 cause you  need that many drivers (sometimes 1 mostly 2)
      1/6 cause you get 6 MPG
      0.29 must be oil, etc.
    */
    var cost = 2 * ((0.29 + (1.0/6.0)*FUEL_COST)*miles + 1.67*TRUCK_LABOR*hours) / tonsPerTruck;
    //var cost = (FUEL_COST*miles + TRUCK_LABOR*hours) / tonsPerTruck;
    return cost;

/*
      tons_per_truck:=inl.tons_per_truck(material,county_fips);
      FCr := (inl.fuel_cost(county_fips,year)).on_road;
      LCtd := inl.labor_cost('truck',county_fips,year);
      IF (material = 'bale') THEN
        cost:=2*((0.29 + (1.0/6.0)*FCr)*miles + 1.67*LCtd*hours) / tons_per_truck;
*/
  };
};

function getTonsPerTruck(material) {
  if (material === 'bale') return 17; // tons/truck  @ 26 *  0.65445 tons/bale
  if (material === 'bulk') return 19.9; // tons/truck @ 9.1 lb / ft 3
  return 18.5;
}
