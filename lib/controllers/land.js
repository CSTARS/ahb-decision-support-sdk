var collection = require('../collections/land');


function LandController() {

    this.getLandCost = function(parcel) {
      var type = 'irrigated';
      if( parcel.properties.ucd.cropInfo.pasture ) {
        type = 'nonirrigated';
      }
      
      return collection.get(parcel.properties.ucd.state, type);
    };

}