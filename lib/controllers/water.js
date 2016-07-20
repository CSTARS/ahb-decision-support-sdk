var collection = require('../collections/water');


function WaterController() {
  this.ACRE_FT_WATER_PER_ACRE = 3.4;

  // $ / acre - ft
  this.getCost = function(parcel) {
    if( parcel.properties.ucd.cropInfo.pasture ) {
      return 0;
    }
    return collection.getCost(parcel.properties.ucd.state);
  }

  this.getIrrigationCost = function(parcel, growthProfile) {
    // TODO : why the 0.3048 again?
    var waterCost = this.getCost(parcel); // * 0.3048; 
    // per acre per year irrigation
    var irrigation = growthProfile.totalIrrigation / growthProfile.data.years;

    return waterCost * irrigation * this.ACRE_FT_WATER_PER_ACRE;
  }
}

module.exports = new WaterController();