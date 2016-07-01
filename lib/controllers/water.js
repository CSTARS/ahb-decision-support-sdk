var collection = require('../collections/water');


function WaterController() {
  this.getCost = function(parcel) {
    if( parcel.properties.ucd.cropInfo.pasture ) {
      return 0;
    }
    return this.collection.getCost(parcel.properties.ucd.state);
  }
}

module.exports = new WaterController();