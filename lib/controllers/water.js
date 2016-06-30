var collection = require('../collections/water');


function WaterController() {
  this.getWaterCost = function(parcel) {
    if( parcel.properties.ucd.cropInfo.pasture ) {
      return 0;
    }
    return this.collection.get(parcel.properties.ucd.state);
  }
}

return new WaterController();